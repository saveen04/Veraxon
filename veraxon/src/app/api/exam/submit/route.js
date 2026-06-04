/**
 * POST /api/exam/submit
 * Grades the exam and writes a result doc to Firestore.
 *
 * Admin SDK is not configured locally, so this route uses the client Firebase
 * SDK directly (same credentials as the browser — safe for server-side use
 * in Next.js API routes since it runs server-side Node.js with the public config).
 */
import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, addDoc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || "AIzaSyDOazunHRF6xSI37d6Dxru0MHXZR89OuFg",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || "veraxon-04.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || "veraxon-04",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || "veraxon-04.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID|| "412386840139",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || "1:412386840139:web:26864e37c6e22cebc907ce",
};

function getDb() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return getFirestore(app);
}

export async function POST(req) {
  try {
    const { examId, studentId, userName, answers = [], totalViolations = 0 } = await req.json();

    if (!examId || !studentId) {
      return NextResponse.json({ error: "examId and studentId are required" }, { status: 400 });
    }

    const db = getDb();

    // Fetch the test (builder saves to 'tests', not 'exams')
    let testData = null;
    try {
      const testDoc = await getDoc(doc(db, "tests", examId));
      if (testDoc.exists()) testData = testDoc.data();
    } catch { /* try exams collection */ }

    if (!testData) {
      try {
        const examDoc = await getDoc(doc(db, "exams", examId));
        if (examDoc.exists()) testData = examDoc.data();
      } catch { /* both failed */ }
    }

    // Grade answers if we have test data with correct answers
    let score = 0;
    let totalMarks = 0;

    if (testData?.questions?.length) {
      testData.questions.forEach((q, idx) => {
        const marks = q.marks ?? 1;
        totalMarks += marks;
        const studentAns = answers[idx];
        const correct    = q.correctAnswer ?? q.correct ?? null;
        if (studentAns !== null && studentAns !== undefined && correct !== null && studentAns === correct) {
          score += marks;
        }
      });
    } else {
      // No questions available — use percentage from submission if stored
      totalMarks = 100;
    }

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const passed     = percentage >= 40;
    const examTitle  = testData?.title ?? "Assessment";

    // Write result doc
    const resultRef = await addDoc(collection(db, "results"), {
      studentId,
      examId,
      examTitle,
      score,
      totalMarks,
      percentage,
      passed,
      totalViolations,
      createdAt: serverTimestamp(),
    });

    // Update submission status
    const submissionId = `${examId}_${studentId}`;
    await setDoc(doc(db, "submissions", submissionId), {
      status:       "completed",
      finalAnswers: answers,
      score,
      totalMarks,
      percentage,
      passed,
      examTitle,
      totalViolations,
      completedAt:  serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      success:    true,
      score,
      totalMarks,
      percentage,
      passed,
      resultId:   resultRef.id,
      examTitle,
    });
  } catch (err) {
    console.error("[exam/submit]", err);
    return NextResponse.json({ error: "Internal error during exam evaluation" }, { status: 500 });
  }
}
