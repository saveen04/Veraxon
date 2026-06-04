/**
 * POST /api/auth/register
 * Registration is handled client-side via Firebase Auth SDK (createUserWithEmailAndPassword).
 * This route is a stub — avoids Admin SDK + bcrypt crashes.
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Use Firebase Auth client SDK for registration." },
    { status: 501 }
  );
}
