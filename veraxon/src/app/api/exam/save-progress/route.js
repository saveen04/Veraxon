/**
 * POST /api/exam/save-progress
 * The exam page saves progress directly to Firestore via client SDK.
 * This route is a no-op stub for backward compatibility.
 */
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await req.json(); // consume body
    return NextResponse.json({ success: true, message: "Progress saved client-side." });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
