import { NextResponse } from 'next/server';

const AI_BASE = 'http://127.0.0.1:8000';
const TIMEOUT_MS = 4000;

/**
 * Fetch with a timeout so a slow/offline Python service never hangs Next.js.
 */
async function fetchWithTimeout(url, options, ms = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * POST /api/proctor/detect
 * Body: { image, examId, studentId, studentName?, violationCount? }
 *
 * Forwards to Python pipeline. Returns the full structured result including
 * risk score, infractions, violation_event, and metrics.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { image, examId, studentId, studentName = 'Candidate', violationCount = 0 } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'image is required' },
        { status: 400 }
      );
    }

    // ── Try Python pipeline ────────────────────────────────────
    try {
      const pyRes = await fetchWithTimeout(
        `${AI_BASE}/detect`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image, examId, studentId, studentName, violationCount }),
        }
      );

      if (pyRes.ok) {
        const result = await pyRes.json();
        return NextResponse.json(result);
      }
      throw new Error(`AI service HTTP ${pyRes.status}`);

    } catch (fetchErr) {
      // ── Intelligent offline fallback ───────────────────────
      console.warn('[proctor/detect] AI service offline, using fallback:', fetchErr.message);
      return NextResponse.json(buildFallback(examId, violationCount));
    }

  } catch (err) {
    console.error('[proctor/detect] Route error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal routing error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/proctor/event
 * Separate handler for browser-side events (tab switch, fullscreen exit).
 * Body: { eventType, examId, studentId, studentName?, violationCount? }
 */
export async function PUT(req) {
  try {
    const body = await req.json();
    const { eventType, examId, studentId, studentName = 'Candidate', violationCount = 0 } = body;

    if (!eventType) {
      return NextResponse.json({ success: false, error: 'eventType is required' }, { status: 400 });
    }

    try {
      const pyRes = await fetchWithTimeout(
        `${AI_BASE}/event`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType, examId, studentId, studentName, violationCount }),
        }
      );
      if (pyRes.ok) return NextResponse.json(await pyRes.json());
      throw new Error(`AI service HTTP ${pyRes.status}`);
    } catch {
      return NextResponse.json(buildEventFallback(eventType, violationCount));
    }

  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal routing error' }, { status: 500 });
  }
}

// ─── Fallback builders ────────────────────────────────────────────

function computeRisk(inf) {
  const weights = {
    no_face: 30, multiple_faces: 45, phone_detected: 50,
    looking_away: 20, head_turned: 15,
  };
  let score = Object.entries(weights).reduce((s, [k, w]) => s + (inf[k] ? w : 0), 0);
  score = Math.min(score, 100);
  const level = score < 21 ? 'low' : score < 51 ? 'moderate' : score < 81 ? 'high' : 'critical';
  return { score, level };
}

function buildFallback(examId = '', violationCount = 0) {
  // Simulation hooks for local development/testing
  const noFace   = examId.includes('simulate_no_face');
  const multiFace= examId.includes('simulate_multiple');
  const phone    = examId.includes('simulate_phone');

  const infractions = {
    no_face:        noFace,
    multiple_faces: multiFace,
    phone_detected: phone,
    book_detected:  false,
    looking_away:   false,
    head_turned:    false,
    voice_anomaly:  false,
    tab_switch:     false,
    fullscreen_exit:false,
    environment:    false,
  };

  const severity = phone ? 'breach' : (noFace || multiFace) ? 'warning' : 'secure';
  const decision = phone ? 'Breach' : (noFace || multiFace) ? 'Suspicious' : 'Normal';
  const risk = computeRisk(infractions);

  let violationEvent = null;
  if (severity !== 'secure') {
    const count = violationCount + 1;
    violationEvent = {
      type:       phone ? 'phone_detected' : noFace ? 'no_face' : 'multiple_faces',
      severity,
      count,
      autoSubmit: count >= 4,
      riskScore:  risk.score,
    };
  }

  return {
    success:         true,
    decision,
    severity,
    risk,
    infractions,
    metrics: {
      face_count:       noFace ? 0 : multiFace ? 2 : 1,
      phone_confidence: phone ? 0.95 : 0,
      voice_status:     'clear',
      latency_ms:       0,
    },
    violation_event:  violationEvent,
    offline_fallback: true,
  };
}

function buildEventFallback(eventType, violationCount = 0) {
  const count = violationCount + 1;
  const score = eventType === 'tab_switch' ? 20 : 15;
  return {
    success:  true,
    decision: 'Suspicious',
    severity: 'warning',
    risk:     { score, level: 'low' },
    infractions: {
      tab_switch:      eventType === 'tab_switch',
      fullscreen_exit: eventType === 'fullscreen_exit',
    },
    violation_event: {
      type: eventType, severity: 'warning',
      count, autoSubmit: count >= 4, riskScore: score,
    },
    offline_fallback: true,
  };
}
