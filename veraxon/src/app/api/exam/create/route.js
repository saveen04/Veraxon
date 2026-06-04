/**
 * POST /api/exam/create
 * Exam creation is handled by the staff builder page using the client Firestore SDK.
 * This route is a stub — returns 501 to avoid Admin SDK crashes.
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Use client-side Firestore to create exams." },
    { status: 501 }
  );
}
