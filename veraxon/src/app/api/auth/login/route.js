/**
 * POST /api/auth/login
 * Login is handled client-side via Firebase Auth SDK (signInWithEmailAndPassword).
 * This route is a stub — avoids Admin SDK crashes.
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Use Firebase Auth client SDK for login." },
    { status: 501 }
  );
}
