import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(req) {
  try {
    const { examId, studentId, answers } = await req.json();

    if (!examId || !studentId || !answers) {
      return NextResponse.json(
        { error: "Please provide examId, studentId, and answers array" },
        { status: 400 },
      );
    }

    const db = getAdminFirestore();
    const attemptsRef = db.collection("attempts");
    const querySnapshot = await attemptsRef
      .where("examId", "==", examId)
      .where("studentId", "==", studentId)
      .where("status", "==", "started")
      .limit(1)
      .get();

    let attemptId;
    if (querySnapshot.empty) {
      const docRef = await attemptsRef.add({
        examId,
        studentId,
        answers,
        status: "started",
        startTime: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });
      attemptId = docRef.id;
    } else {
      const docRef = querySnapshot.docs[0].ref;
      await docRef.update({
        answers,
        lastUpdated: new Date().toISOString(),
      });
      attemptId = docRef.id;
    }

    return NextResponse.json({
      success: true,
      message: "Assessment progress saved successfully",
      attemptId,
    });
  } catch (error) {
    console.error("Save Progress Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error during progress saving" },
      { status: 500 },
    );
  }
}
