/**
 * GET /api/result/get
 *
 * Firebase Admin SDK is not configured (FIREBASE_ADMIN_SDK_KEY missing).
 * All result data is fetched directly via client-side Firestore on the
 * results page and student/result/[id] page.
 *
 * This route returns 501 so pages can detect and fall back to client Firestore.
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
