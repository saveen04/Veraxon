import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(req) {
  try {
    const { title, duration, questions, createdBy, collegeName, department } =
      await req.json();

    if (!title || !duration || !questions || !questions.length) {
      return NextResponse.json(
        {
          error:
            "Please provide exam title, duration, and at least one question",
        },
        { status: 400 },
      );
    }

    const db = getAdminFirestore();

    const examData = {
      title,
      duration: parseInt(duration),
      questions,
      createdBy: createdBy || "system",
      collegeName: collegeName || "",
      department: department || "",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("exams").add(examData);

    return NextResponse.json({
      success: true,
      message: "Exam created successfully",
      examId: docRef.id,
    });
  } catch (error) {
    console.error("Create Exam API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during exam creation" },
      { status: 500 },
    );
  }
}
