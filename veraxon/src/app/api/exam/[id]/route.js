import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

export async function GET(req, { params }) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "Exam ID required" }, { status: 400 });

    const db = getDb();

    // Try 'tests' first (builder collection), fall back to 'exams'
    let testData = null;
    let testId   = id;

    const testDoc = await getDoc(doc(db, "tests", id));
    if (testDoc.exists()) {
      testData = testDoc.data();
    } else {
      const examDoc = await getDoc(doc(db, "exams", id));
      if (examDoc.exists()) testData = examDoc.data();
    }

    if (!testData) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Strip correct answers before sending to client
    const sanitizedQuestions = (testData.questions ?? []).map((q) => {
      const { correctAnswer, solution, correct, answer, ...rest } = q;
      return rest;
    });

    return NextResponse.json({
      success: true,
      exam: {
        id:        testId,
        title:     testData.title,
        duration:  testData.duration,
        questions: sanitizedQuestions,
        createdBy: testData.createdBy,
        status:    testData.status,
      },
    });
  } catch (err) {
    console.error("[exam/id]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
