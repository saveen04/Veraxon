/**
 * POST /api/proctor/log
 * Violation logging via client-side Firebase SDK.
 * Admin SDK is not configured — ProctoringCamera writes directly to Firestore.
 * This route is kept for backward compatibility but returns 200 immediately.
 */
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { examId, studentId, type } = body;

    if (!examId || !studentId || !type) {
      return NextResponse.json(
        { error: "examId, studentId, and type are required" },
        { status: 400 }
      );
    }

    // Violations are written directly by ProctoringCamera.js to Firestore
    // using the client Firebase SDK — no Admin SDK needed here.
    return NextResponse.json({
      success:  true,
      message:  "Violation acknowledged — client-side logging handles persistence.",
    });
  } catch (err) {
    console.error("[proctor/log]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
