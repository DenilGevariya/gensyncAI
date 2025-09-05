"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { resumeAnalysisSchema } from "@/app/lib/schema";
import { analyzeResume } from "@/actions/analyzeresume";

const UploadForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm({
    resolver: zodResolver(resumeAnalysisSchema),
  });

  const validateAndSetFile = (file) => {
    // Clear previous errors
    clearErrors("resumeFile");
    
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return false;
    }
    
    // Check file extension (more reliable than MIME type for PDFs)
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      toast.error("Only PDF files are allowed");
      return false;
    }
    
    return true;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (validateAndSetFile(file)) {
        setSelectedFile(file);
        setValue("resumeFile", file);
        toast.success("File selected successfully!");
      } else {
        // Reset file input
        event.target.value = '';
        setSelectedFile(null);
        setValue("resumeFile", null);
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (validateAndSetFile(file)) {
        setSelectedFile(file);
        setValue("resumeFile", file);
        toast.success("File dropped successfully!");
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setValue("resumeFile", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data) => {
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("companyName", data.companyName);
      formData.append("jobTitle", data.jobTitle);
      formData.append("jobDescription", data.jobDescription);
      formData.append("resumeFile", selectedFile);

      const result = await analyzeResume(formData);
      
      if (result.success) {
        toast.success("Resume analyzed successfully!");
        router.push("/resume-analyzer/dashboard");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze resume. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-background">
      <Card className="w-full max-w-2xl mt-10 mx-2">
        <CardHeader>
          <CardTitle className="gradianet-title text-4xl">
            Resume Analyzer
          </CardTitle>
          <CardDescription>
            Upload your resume and job details to get AI-powered insights and ATS score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Enter current or dream company name"
                {...register("companyName")}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Senior Software Engineer"
                {...register("jobTitle")}
              />
              {errors.jobTitle && (
                <p className="text-sm text-red-500">
                  {errors.jobTitle.message}
                </p>
              )}
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the complete job description here..."
                className="h-32"
                {...register("jobDescription")}
              />
              {errors.jobDescription && (
                <p className="text-sm text-red-500">
                  {errors.jobDescription.message}
                </p>
              )}
            </div>

            {/* Resume File Upload */}
            <div className="space-y-2">
              <Label htmlFor="resumeFile">Resume (PDF only, max 5MB)</Label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload or drag & drop your resume
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF files only, maximum 5MB
                    </p>
                  </div>
                )}
              </div>
              {errors.resumeFile && (
                <p className="text-sm text-red-500">
                  {errors.resumeFile.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !selectedFile}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                "Analyze Resume"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadForm;
