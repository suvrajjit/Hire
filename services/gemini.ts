import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("Missing VITE_GEMINI_API_KEY in environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export interface AuditResult {
  score: number;
  redFlags: { title: string; description: string }[];
  greenFlags: { title: string; description: string }[];
  summary: string;
}

export async function analyzeResume(resumeText: string): Promise<AuditResult> {
  if (!API_KEY) {
    throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env.local file.");
  }

  const prompt = `
    Act as a ruthless Hiring Manager at a top-tier tech company. Your job is to filter out candidates.
    Analyze the following resume text and identify "Red Flags" (Deal Breakers) that would cause an immediate rejection, 
    and "Green Flags" (Standout Qualities) that might save them.

    Resume Text:
    "${resumeText}"

    Output your analysis strictly in JSON format with the following structure:
    {
      "score": number, // 0-100, be harsh. 100 is impossible, 80 is amazing, 50 is average.
      "redFlags": [
        { "title": "Short punchy title (e.g., 'Weak Verbs')", "description": "Ruthless explanation of why this hates." }
      ],
      "greenFlags": [
         { "title": "Short punchy title", "description": "Why this impressed you." }
      ],
      "summary": "A 2-sentence brutal summary of the candidate."
    }
    
    Limit to 3 Red Flags and 3 Green Flags max.
    Do not use markdown code blocks, just raw JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting if Gemini adds it
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText) as AuditResult;
  } catch (error) {
    console.error("Gemini Audit Failed:", error);
    throw new Error("Failed to analyze resume. The hiring manager is currently out of office (API Error).");
  }
}
// ... previous code

export type Persona = 'grumpy_cto' | 'behavioral_hr' | 'visionary_founder';

const PERSONA_PROMPTS: Record<Persona, string> = {
    grumpy_cto: "Act as a cynical, technically brilliant but impatient CTO. You care about code quality, scalability, and hate buzzwords. You are drilling the candidate.",
    behavioral_hr: "Act as a strict HR manager focused on culture fit, conflict resolution, and soft skills. You use STAR method questions and detect lies.",
    visionary_founder: "Act as an intense startup founder. You care about hustle, growth hacking, and 'doing whatever it takes'. You are inspiring but demanding."
};

export async function startInterviewSession(persona: Persona, resumeText: string) {
    if (!API_KEY) throw new Error("API Key Missing");

    // Initialize chat with system instruction
    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: `
                    System Instruction: ${PERSONA_PROMPTS[persona]}
                    
                    Context: ${resumeText ? `You are interviewing a candidate with the following resume: "${resumeText}"` : "The candidate has not provided a resume. Ask them general questions about their background, experience, and technical skills."}

                    Goal: ${resumeText ? "Grill them on their resume gaps and weak points identified in the audit." : "Conduct a rigorous general technical and behavioral interview."} Be conversational but challenging. Start by introducing yourself in character and asking the first hard question.
                    
                    Keep responses concise (max 2-3 sentences).
                ` }]
            },
            {
                role: "model",
                parts: [{ text: "Understood. I'm ready." }]
            }
        ],
        generationConfig: {
            maxOutputTokens: 1000,
        }
    });

    return chat;
}

export interface RoadmapItem {
    week: string;
    title: string;
    topics: string[];
    action: string;
}

export async function generateRoadmap(resumeText: string, redFlags: any[]): Promise<RoadmapItem[]> {
    if (!API_KEY) throw new Error("API Key Missing");

    const prompt = `
        Act as a senior engineering mentor. Based on the resume analysis, generate a high-intensity 12-week (90-day) learning roadmap to fix the candidate's weaknesses (Red Flags).

        Red Flags Identified:
        ${JSON.stringify(redFlags)}

        Resume Context:
        "${resumeText.slice(0, 5000)}"

        Generate a JSON array of 6 phases (2 weeks each) strictly in this format:
        [
            { 
                "week": "Weeks 1-2", 
                "title": "Punchy Phase Name", 
                "topics": ["Skill 1", "Skill 2", "Concept A"], 
                "action": "Build a specific mini-project (e.g. 'Build a CLI tool in Rust')" 
            }
        ]

        Do not include markdown blocks. Return only raw JSON.
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text) as RoadmapItem[];
    } catch (error) {
        console.error("Roadmap Gen Failed:", error);
        throw new Error("Failed to generate roadmap.");
    }
}
