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

    // 1. Fetch the exam with the correct answers
    const examDoc = await db.collection("exams").doc(examId).get();
    if (!examDoc.exists) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const examData = examDoc.data();

    // 2. Grade the attempt
    let calculatedScore = 0;
    let totalMarks = 0;

    const questions = examData.questions || [];
    questions.forEach((question, idx) => {
      const qMarks = question.marks || question.points || 1;
      totalMarks += qMarks;

      const studentAnswer = answers[idx];
      const correctAnswer =
        question.correctAnswer !== undefined
          ? question.correctAnswer
          : question.correct !== undefined
            ? question.correct[0]
            : null;

      // If student choice matches correct answer index
      if (
        studentAnswer !== undefined &&
        correctAnswer !== null &&
        studentAnswer === correctAnswer
      ) {
        calculatedScore += qMarks;
      }
    });

    const percentage =
      totalMarks > 0 ? Math.round((calculatedScore / totalMarks) * 100) : 0;
    const passed = percentage >= 40; // 40% passing score threshold

    // 3. Record the final Result
    const resultRef = await db.collection("results").add({
      studentId,
      examId,
      examTitle: examData.title || "Exam",
      score: calculatedScore,
      totalMarks,
      percentage,
      passed,
      createdAt: new Date().toISOString(),
    });

    // 4. Update the Attempt state to submitted
    const attemptsRef = db.collection("attempts");
    const querySnapshot = await attemptsRef
      .where("examId", "==", examId)
      .where("studentId", "==", studentId)
      .where("status", "==", "started")
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      await querySnapshot.docs[0].ref.update({
        answers,
        status: "submitted",
        endTime: new Date().toISOString(),
      });
    } else {
      await attemptsRef.add({
        examId,
        studentId,
        answers,
        status: "submitted",
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      score: calculatedScore,
      totalMarks,
      percentage,
      passed,
      resultId: resultRef.id,
    });
  } catch (error) {
    console.error("Submit Exam API Error:", error);
    return NextResponse.json(
      { error: "Internal server error during exam evaluation" },
      { status: 500 },
    );
  }
}
