/**
 * GET /api/student/stats?studentId=xxx
 *
 * NOTE: Firebase Admin SDK requires FIREBASE_ADMIN_SDK_KEY env var.
 * Since that is not configured locally, this route delegates all data
 * fetching to the client-side Firestore SDK (called directly from the
 * page component). This route now acts as a lightweight health check
 * and returns a 501 so the page can fall back gracefully.
 *
 * The student/stats page fetches data directly via client Firebase.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      fallback: true,
      message: 'Use client-side Firestore — Admin SDK not configured.',
    },
    { status: 501 }
  );
}
