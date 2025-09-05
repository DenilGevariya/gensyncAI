"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// Enhanced PDF text extraction
async function extractTextFromPDF(buffer) {
  let resumeText = "";
  let method = "";

  console.log("Starting PDF extraction...");

  // Method 1: pdf-parse (primary)
  try {
    const pdf = (await import('pdf-parse')).default;
    const pdfData = await pdf(buffer, {
      max: 0, // Extract all pages
      version: 'v1.10.100'
    });
    
    resumeText = pdfData.text?.trim() || "";
    method = "pdf-parse";
    console.log("PDF-parse successful. Text length:", resumeText.length);
    
  } catch (pdfParseError) {
    console.log("PDF-parse failed:", pdfParseError.message);
    
    // Method 2: pdf2json (fallback)
    try {
      console.log("Trying pdf2json fallback...");
      const PDFParser = (await import('pdf2json')).default;
      
      resumeText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        let timeoutHandle;
        
        pdfParser.on("pdfParser_dataError", (errData) => {
          clearTimeout(timeoutHandle);
          reject(new Error("PDF2JSON parsing failed"));
        });
        
        pdfParser.on("pdfParser_dataReady", (pdfData) => {
          clearTimeout(timeoutHandle);
          try {
            let extractedText = "";
            
            if (pdfData?.Pages && Array.isArray(pdfData.Pages)) {
              pdfData.Pages.forEach((page) => {
                if (page.Texts && Array.isArray(page.Texts)) {
                  page.Texts.forEach(textItem => {
                    if (textItem.R && Array.isArray(textItem.R)) {
                      textItem.R.forEach(textRun => {
                        if (textRun.T) {
                          try {
                            extractedText += decodeURIComponent(textRun.T) + " ";
                          } catch (decodeError) {
                            extractedText += textRun.T + " ";
                          }
                        }
                      });
                    }
                  });
                }
                extractedText += "\n";
              });
            }
            
            resolve(extractedText.trim());
          } catch (parseError) {
            reject(parseError);
          }
        });
        
        timeoutHandle = setTimeout(() => {
          reject(new Error("PDF parsing timeout"));
        }, 15000);
        
        pdfParser.parseBuffer(buffer);
      });
      
      method = "pdf2json";
      console.log("PDF2JSON successful. Length:", resumeText.length);
      
    } catch (pdf2jsonError) {
      console.log("PDF2JSON also failed:", pdf2jsonError.message);
      method = "failed";
    }
  }

  return { text: resumeText, method };
}

export async function analyzeResume(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  try {
    const companyName = formData.get('companyName');
    const jobTitle = formData.get('jobTitle');
    const jobDescription = formData.get('jobDescription');
    const resumeFile = formData.get('resumeFile');

    console.log("=== RESUME ANALYSIS START ===");
    console.log("File details:", {
      name: resumeFile?.name,
      size: resumeFile?.size,
      type: resumeFile?.type
    });

    if (!resumeFile || resumeFile.size === 0) {
      throw new Error("Please upload a resume file");
    }

    // Save file
    const bytes = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const timestamp = Date.now();
    const filename = `resume_${userId}_${timestamp}.pdf`;
    
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Extract text
    const { text: resumeText, method } = await extractTextFromPDF(buffer);
    
    console.log("Extraction results:", {
      method,
      textLength: resumeText.length,
      preview: resumeText.substring(0, 200) + "..."
    });

    // Generate analysis with unified prompt
    const analysis = await generateUnifiedAnalysis(
      resumeText,
      jobDescription,
      jobTitle,
      companyName,
      method
    );

    // Save to database
    const resumeAnalysis = await db.resumeAnalysis.create({
      data: {
        userId: user.id,
        companyName,
        jobTitle,
        jobDescription,
        resumeUrl: `/uploads/${filename}`,
        atsScore: analysis.atsScore,
        analysis: analysis,
      },
    });

    return { success: true, id: resumeAnalysis.id };

  } catch (error) {
    console.error("Resume analysis error:", error);
    throw new Error("Failed to analyze resume: " + error.message);
  }
}

// UNIFIED ANALYSIS FUNCTION
async function generateUnifiedAnalysis(resumeText, jobDescription, jobTitle, companyName, extractionMethod) {
  console.log("Starting unified AI analysis...");
  
  // Single comprehensive prompt that handles all cases
  const prompt = `
You are an expert ATS resume analyzer. Analyze the provided resume content against the job requirements and provide comprehensive insights.

RESUME CONTENT:
${resumeText}

EXTRACTION METHOD: ${extractionMethod}

JOB DETAILS:
Company: ${companyName}
Position: ${jobTitle}
Job Description: ${jobDescription.substring(0, 4000)}

INSTRUCTIONS:
1.  perform detailed analysis comparing resume against job requirements
2. If resume content is limited or poor quality, focus on job requirements analysis and provide optimization guidance
3. Always extract keywords from the job description for missing keywords section
4. Generate realistic and helpful recommendations regardless of resume text quality
5. Provide actionable insights that help improve the application

Provide analysis in this exact JSON format:

{
  "summary": "Write a 2-3 sentence analysis. If resume text is available, compare it to job requirements. If not available, focus on job requirements and what an ideal resume should contain for this role.",
  "atsScore": [Provide realistic score: 60-95 if good resume content available, 45-65 if limited content, based on apparent fit],
  "strengths": [
    "List actual strengths found in resume related to the job",
    "List general strengths of applying to this role",
    "Include 3-4 relevant points based on available information"
  ],
  "weaknesses": [
    "If resume available: Specific gaps between resume and job requirements", 
    "If limited content: Areas that need attention for this role",
    "Include 2-3 actionable areas for improvement"
  ],
  "keywordMatches": {
    "matched": [
      "If resume available: List keywords found in both resume and job description",
    ],
    "missing": [
      "ALWAYS extract 6-10 key technical skills and requirements from the job description",
      "Include programming languages, frameworks, tools, methodologies, certifications",
      "Add soft skills and experience levels mentioned in job posting"
    ]
  },
  "suggestions": [
    "Provide 5-6 specific, actionable recommendations",
    "If resume available: Specific improvements based on gaps found",
    "If resume limited: General optimization advice for this role",
    "Include advice on keywords, formatting, content, achievements",
    "Make suggestions specific to the ${jobTitle} role and ${companyName}"
  ],
  "skillsAnalysis": {
    "present": [
      "If resume available: List 6-10 technical and professional skills found in resume",
    ],
    "recommended": [
      "ALWAYS extract 8-12 key skills from the job description",
      "Include technical requirements, tools, frameworks, methodologies",
      "Add certifications and qualifications mentioned in job posting"
    ]
  }
}

IMPORTANT: 
- Always populate "missing" keywords and "recommended" skills from the job description regardless of resume quality
- Make the analysis helpful and actionable
- Be realistic about scores and assessments
- Focus on what will help the candidate succeed
- Return ONLY the JSON object, no other text

JSON Response:`;

  console.log("Sending unified prompt to AI...");
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  console.log("AI response received, length:", text.length);

  // Parse JSON response
  let cleanedText = text.replace(/``````/g, '').trim();
  const jsonStart = cleanedText.indexOf('{');
  const jsonEnd = cleanedText.lastIndexOf('}') + 1;
  
  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleanedText = cleanedText.substring(jsonStart, jsonEnd);
  }

  const parsedAnalysis = JSON.parse(cleanedText);

  // Validate and ensure data quality
  const validatedAnalysis = {
    summary: parsedAnalysis.summary || `Analysis completed for ${jobTitle} position at ${companyName}`,
    atsScore: Math.max(0, Math.min(100, parsedAnalysis.atsScore || 50)),
    strengths: Array.isArray(parsedAnalysis.strengths) ? parsedAnalysis.strengths.filter(s => s && s.length > 5) : [],
    weaknesses: Array.isArray(parsedAnalysis.weaknesses) ? parsedAnalysis.weaknesses.filter(w => w && w.length > 5) : [],
    keywordMatches: {
      matched: Array.isArray(parsedAnalysis.keywordMatches?.matched) ? 
        parsedAnalysis.keywordMatches.matched.filter(k => k && k.length > 2) : [],
      missing: Array.isArray(parsedAnalysis.keywordMatches?.missing) ? 
        parsedAnalysis.keywordMatches.missing.filter(k => k && k.length > 2) : []
    },
    suggestions: Array.isArray(parsedAnalysis.suggestions) ? 
      parsedAnalysis.suggestions.filter(s => s && s.length > 10) : [],
    skillsAnalysis: {
      present: Array.isArray(parsedAnalysis.skillsAnalysis?.present) ? 
        parsedAnalysis.skillsAnalysis.present.filter(s => s && s.length > 2) : [],
      recommended: Array.isArray(parsedAnalysis.skillsAnalysis?.recommended) ? 
        parsedAnalysis.skillsAnalysis.recommended.filter(s => s && s.length > 2) : []
    }
  };

  console.log("Analysis completed successfully:", {
    atsScore: validatedAnalysis.atsScore,
    strengthsCount: validatedAnalysis.strengths.length,
    weaknessesCount: validatedAnalysis.weaknesses.length,
    matchedKeywords: validatedAnalysis.keywordMatches.matched.length,
    missingKeywords: validatedAnalysis.keywordMatches.missing.length
  });

  return validatedAnalysis;
}

// Single function to get all user's resume analyses
// Change the getUserResumeAnalyses function to return only the latest analysis
export async function getUserResumeAnalyses() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  // Get only the most recent analysis
  const latestAnalysis = await db.resumeAnalysis.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return latestAnalysis; // Return single object instead of array
}
