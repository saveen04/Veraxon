/**
 * POST /api/auth/update-profile
 * Profile updates are handled client-side in the onboarding and settings pages.
 * This route is a stub — avoids Admin SDK crashes.
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Use client-side Firestore to update profiles." },
    { status: 501 }
  );
}
