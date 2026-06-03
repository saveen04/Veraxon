import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Exam ID is required" },
        { status: 400 },
      );
    }

    const db = getAdminFirestore();
    const examDoc = await db.collection("exams").doc(id).get();

    if (!examDoc.exists) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const examData = examDoc.data();

    // Sanitize questions to protect correct answers and solutions from being inspected in the client
    const sanitizedQuestions = (examData.questions || []).map((q) => {
      const { correctAnswer, solution, correct, ...rest } = q;
      return rest;
    });

    const exam = {
      id: examDoc.id,
      title: examData.title,
      duration: examData.duration,
      questions: sanitizedQuestions,
      createdBy: examData.createdBy,
    };

    return NextResponse.json({
      success: true,
      exam,
    });
  } catch (error) {
    console.error("Fetch Exam API Error:", error);
    return NextResponse.json(
      { error: "Internal server error during exam retrieval" },
      { status: 500 },
    );
  }
}
