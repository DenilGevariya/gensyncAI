"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

/**
 * Generate roadmap JSON using Gemini
 */
export const generateAIRoadmap = async (field) => {
  const prompt = `
Generate a roadmap in JSON for the ${field} user’s chosen skill/position. 
The roadmap should follow a vertical tree structure similar to roadmap.sh with spacious node placement.

Requirements:
- Roadmap metadata: title, description (3-5 lines), estimated duration.
- Steps ordered from fundamentals to advanced.
- Branching for specializations if applicable.
- Each node must have:
   - unique id
   - type (e.g., "turbo", "branch")
   - position (spacious: x=0, ±300, y increments of 350)
   - data {title, description (≤2 lines), link}
- Each edge must have:
   - unique id
   - source node id
   - target node id
   - (optional) animated:true, type:"smoothstep"

Return response strictly in this JSON format:
{
  roadmapTitle: "",
  description: "",
  duration: "",
  initialNodes: [ ... ],
  initialEdges: [ ... ]
}
    Rules:
  - Steps must go from fundamentals → intermediate → advanced.
  - Include branching if there are specializations.
  - Use unique IDs for all nodes/edges.
  - Spread nodes with meaningful x/y positions so they form a readable tree (vertical like roadmap.sh).
  - Provide 10–15 steps minimum.
  - Return ONLY JSON (no markdown, no explanation).

  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  return JSON.parse(cleanedText);
};

/**
 * Save roadmap to database for logged-in user
 */
export async function createRoadmap(field) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");
  // Generate roadmap JSON
  const roadmapJson = await generateAIRoadmap(field);

  // Save to DB
  const roadmap = await db.roadmap.create({
    data: {
      userId: user.id,
      field,
      roadmapData: roadmapJson,
    },
  });

  return roadmap;
}

/**
 * Get all roadmaps of current user
 */
export async function getUserRoadmap(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!userId) throw new Error("User Not Found");

  return await db.roadmap.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}
