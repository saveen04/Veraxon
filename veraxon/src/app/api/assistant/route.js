import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Using the key provided by the user. 
// In a full production environment, this would strictly be in .env.local
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "REDACTED_GEMINI_KEY";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { history, userMessage, userData } = await req.json();

    const systemInstruction = `You are V.E.R.A (Veraxon Enterprise Recon Agent), the highly-advanced, built-in Neural AI assistant for the Veraxon Academic Integrity platform. 
The user you are speaking to is named ${userData?.username || 'User'} and their platform role is ${userData?.role || 'Guest'}. 
If they are staff, they can monitor AI telemetry, deploy assessments, view violations, and dispatch notifications to candidates.
If they are a student, they can join live assessment sessions, recalibrate webcams, and view rank telemetry.
Your tone should be highly professional, slightly cyberpunk/neural-AI themed, and concisely helpful. 
Keep your responses precise and actionable. Do not format your response with markdown headers, just output plain text or basic bolding.`;

    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest",
        systemInstruction: systemInstruction 
    });

    // Reconstruct history for Gemini
    const chatHistory = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({
        history: chatHistory
    });

    const result = await chat.sendMessage(userMessage);
    const text = result.response.text();

    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ 
        success: false, 
        error: "Neural API Uplink error. Check model parameters or API keys." 
    }, { status: 500 });
  }
}
