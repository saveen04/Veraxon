import { NextResponse } from 'next/server';

const AI_BASE = 'http://127.0.0.1:8000';

/**
 * POST /api/proctor/event
 * Body: { eventType, examId, studentId, studentName?, violationCount? }
 *
 * Handles browser-side proctoring events:
 *   tab_switch | fullscreen_exit | window_blur | copy_attempt
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { eventType, examId, studentId, studentName = 'Candidate', violationCount = 0 } = body;

    if (!eventType) {
      return NextResponse.json({ success: false, error: 'eventType is required' }, { status: 400 });
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const pyRes = await fetch(`${AI_BASE}/event`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ eventType, examId, studentId, studentName, violationCount }),
        signal:  controller.signal,
      });
      clearTimeout(id);
      if (pyRes.ok) return NextResponse.json(await pyRes.json());
      throw new Error(`AI ${pyRes.status}`);
    } catch {
      // Offline fallback
      const count = violationCount + 1;
      const score = { tab_switch: 20, fullscreen_exit: 15, window_blur: 12, copy_attempt: 18 }[eventType] ?? 10;
      return NextResponse.json({
        success: true,
        decision: 'Suspicious',
        severity: count >= 4 ? 'breach' : 'warning',
        risk: { score, level: 'low' },
        infractions: { [eventType === 'tab_switch' ? 'tab_switch' : 'fullscreen_exit']: true },
        violation_event: {
          type: eventType, severity: count >= 4 ? 'breach' : 'warning',
          count, autoSubmit: count >= 4, riskScore: score,
        },
        offline_fallback: true,
      });
    }
  } catch (err) {
    console.error('[proctor/event]', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
