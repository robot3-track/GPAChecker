import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Syllabus text is required." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY env variable is not set on the server." },
        { status: 500 }
      );
    }

    // Call Gemini to parse the syllabus text
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert academic assistant. Analyze the following text from a class syllabus or grading policy.
Extract the grading components (categories and their weights, or assignments and their maximum points).
If both are present, prioritize the overall weighted category system.
Identify whether the grading system is "weighted" or "points".
Also extract any mentioned grading scale letter rules (e.g., A = 90% or above).

Syllabus Text:
"""
${text}
"""`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["gradingSystem", "categories", "gradingScale"],
          properties: {
            gradingSystem: {
              type: Type.STRING,
              description: 'Whether the class uses a "weighted" category system or simple "points" system.',
            },
            categories: {
              type: Type.ARRAY,
              description: "List of grading categories or major assignments extracted from the text.",
              items: {
                type: Type.OBJECT,
                required: ["name"],
                properties: {
                  name: {
                    type: Type.STRING,
                    description: 'The name of the category (e.g., "Quizzes", "Final Exam", "Homework").',
                  },
                  weight: {
                    type: Type.NUMBER,
                    description: "The percentage weight as a number between 0 and 100 (e.g. 25 for 25%). If points system, omit.",
                  },
                  totalPoints: {
                    type: Type.NUMBER,
                    description: "The maximum points possible for this category or assignment. If weighted system, omit.",
                  },
                },
              },
            },
            gradingScale: {
              type: Type.ARRAY,
              description: "The letter grade scale thresholds extracted from the text.",
              items: {
                type: Type.OBJECT,
                required: ["grade", "minPercentage"],
                properties: {
                  grade: {
                    type: Type.STRING,
                    description: 'The letter grade (e.g. "A", "A-", "B+").',
                  },
                  minPercentage: {
                    type: Type.NUMBER,
                    description: "The minimum percentage score required to get this grade (e.g., 93, 90, 87).",
                  },
                },
              },
            },
          },
        },
      },
    });

    const parsedResult = JSON.parse(response.text || "{}");
    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Error parsing syllabus with Gemini:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to analyze the syllabus text." },
      { status: 500 }
    );
  }
}
