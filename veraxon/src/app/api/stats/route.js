import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET/HEAD /api/stats
 *
 * HEAD: Used by env-check page as a latency ping — always returns 200.
 * GET:  Returns 501 — all stats are now fetched client-side via Firestore SDK
 *       since Firebase Admin SDK credentials are not configured locally.
 *       Staff stats page fetches data directly using the client Firebase SDK.
 */

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      fallback: true,
      message: "Stats are fetched client-side. Admin SDK not configured.",
    },
    { status: 501 }
  );
}
