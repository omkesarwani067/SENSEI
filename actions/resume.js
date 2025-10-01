"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

// Initialize AI only if API key exists
let genAI, model;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export async function saveResume(content) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized - Please log in to save your resume");
    }

    // Validate content
    if (!content || typeof content !== 'string' || content.trim() === '') {
      throw new Error("Resume content cannot be empty");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found - Please contact support");
    }

    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: {
        content: content.trim(),
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        content: content.trim(),
      },
    });

    revalidatePath("/resume");
    return {
      success: true,
      data: resume,
      message: "Resume saved successfully"
    };
  } catch (error) {
    console.error("Error saving resume:", error);
    
    // Return more specific error messages
    if (error.message.includes("Unauthorized")) {
      throw new Error("Please log in to save your resume");
    }
    
    if (error.message.includes("User not found")) {
      throw new Error("User account not found. Please contact support");
    }
    
    if (error.message.includes("Database")) {
      throw new Error("Database error. Please try again later");
    }
    
    throw new Error(error.message || "Failed to save resume. Please try again");
  }
}

export async function getResume() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null; // Return null instead of throwing error for better UX
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return null; // Return null instead of throwing error
    }

    const resume = await db.resume.findUnique({
      where: {
        userId: user.id,
      },
    });

    return resume;
  } catch (error) {
    console.error("Error fetching resume:", error);
    return null; // Return null on error to prevent page crashes
  }
}

export async function improveWithAI({ current, type }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized - Please log in to use AI features");
    }

    // Check if AI is available
    if (!model) {
      throw new Error("AI service is currently unavailable. Please check your API configuration");
    }

    // Validate input
    if (!current || typeof current !== 'string' || current.trim() === '') {
      throw new Error("Please provide content to improve");
    }

    if (!type || typeof type !== 'string') {
      throw new Error("Invalid content type specified");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        industryInsight: true,
      },
    });

    if (!user) {
      throw new Error("User not found - Please contact support");
    }

    // Ensure we have a valid industry, default to 'Technology' if not available
    const userIndustry = user.industry || 'Technology';

    const prompt = `
      As an expert resume writer, improve the following ${type} description for a ${userIndustry} professional.
      Make it more impactful, quantifiable, and aligned with industry standards.
      Current content: "${current.trim()}"

      Requirements:
      1. Use strong action verbs
      2. Include metrics and quantifiable results where possible
      3. Highlight relevant technical skills for ${userIndustry}
      4. Keep it concise but detailed (aim for 2-4 bullet points)
      5. Focus on achievements and impact over basic responsibilities
      6. Use industry-specific keywords for ${userIndustry}
      7. Make it ATS-friendly
      
      Format the response as a well-structured description without any additional explanations or markdown formatting.
      Do not include phrases like "Here's an improved version" or similar introductions.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedContent = response.text().trim();

    if (!improvedContent) {
      throw new Error("AI service returned empty response. Please try again");
    }

    return {
      success: true,
      data: improvedContent,
      message: "Content improved successfully"
    };
  } catch (error) {
    console.error("Error improving content:", error);
    
    // Handle specific AI errors
    if (error.message.includes("API key")) {
      throw new Error("AI service configuration error. Please contact support");
    }
    
    if (error.message.includes("quota") || error.message.includes("limit")) {
      throw new Error("AI service is temporarily unavailable due to usage limits. Please try again later");
    }
    
    if (error.message.includes("Unauthorized")) {
      throw new Error("Please log in to use AI features");
    }
    
    throw new Error(error.message || "Failed to improve content with AI. Please try again");
  }
}

// Additional utility function to check if AI is available
export async function checkAIAvailability() {
  return {
    available: !!process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_API_KEY ? "gemini-1.5-flash" : null
  };
}