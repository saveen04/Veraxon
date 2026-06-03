import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("[VERA] GEMINI_API_KEY is not set — assistant will use static fallback responses.");
}

// ─── Retry helper ─────────────────────────────────────────────────────────────
async function withRetry(fn, maxRetries = 3, baseDelayMs = 800) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes("fetch failed") ||
        err?.message?.includes("ECONNRESET") ||
        err?.message?.includes("network") ||
        err?.message?.includes("ETIMEDOUT");
      if (!isRetryable || attempt === maxRetries) break;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`[VERA] Retry ${attempt}/${maxRetries} after ${delay}ms (${err?.status ?? err?.message})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ─── Fallback responses when Gemini is unavailable ───────────────────────────
const FALLBACK_RESPONSES = [
  "Neural uplink is temporarily offline. Please retry in a moment — I'll be back online shortly.",
  "V.E.R.A is reconnecting to the Gemini backbone. Please try your query again.",
  "AI backend is initializing. Your message has been received — please resend in a moment.",
  "Connection to AI core interrupted. The system is recovering and will respond shortly.",
];

let _genAI = null;
function getGenAI() {
  if (!GEMINI_API_KEY) return null;
  if (!_genAI) _genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return _genAI;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { history = [], userMessage, userData } = body;

    if (!userMessage?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 }
      );
    }

    const genAI = getGenAI();

    // ── No key → static fallback ──────────────────────────────────────────
    if (!genAI) {
      return NextResponse.json({
        success: true,
        text: FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)],
        fallback: true,
      });
    }

    const systemInstruction = `You are V.E.R.A (Veraxon Enterprise Recon Agent), the advanced AI assistant for the Veraxon Academic Integrity Platform.
The user is ${userData?.username || "a platform user"} with role "${userData?.role || "guest"}".
${userData?.role === "staff" ? "They can deploy assessments, monitor AI telemetry, view violations, and dispatch notifications." : ""}
${userData?.role === "student" ? "They can join live assessment sessions, check their integrity score, and view performance analytics." : ""}
Tone: professional, precise, concise. Slightly cyberpunk themed. Use plain text — no markdown headers.
Keep responses under 200 words unless a detailed explanation is explicitly requested.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction,
    });

    // Reconstruct chat history for Gemini multi-turn
    const chatHistory = (Array.isArray(history) ? history : [])
      .filter((m) => m?.text?.trim())
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

    const chat = model.startChat({ history: chatHistory });

    const result = await withRetry(() => chat.sendMessage(userMessage));
    const text = result.response.text();

    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error("[VERA] API error:", error?.message);
    return NextResponse.json({
      success: true,
      text: FALLBACK_RESPONSES[0],
      fallback: true,
    });
  }
}
