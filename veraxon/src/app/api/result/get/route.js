import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 },
      );
    }

    const db = getAdminFirestore();
    const resultsRef = db.collection("results");
    const querySnapshot = await resultsRef
      .where("studentId", "==", studentId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: "No assessment result history found.",
      });
    }

    const resultDoc = querySnapshot.docs[0];
    const resultData = resultDoc.data();

    return NextResponse.json({
      success: true,
      result: {
        _id: resultDoc.id,
        examTitle: resultData.examTitle || "Assessment Session",
        score: resultData.score,
        totalMarks: resultData.totalMarks,
        percentage: resultData.percentage,
        passed: resultData.passed,
        createdAt: resultData.createdAt,
      },
    });
  } catch (error) {
    console.error("Fetch Result API Error:", error);
    return NextResponse.json(
      { error: "Internal server error during result retrieval" },
      { status: 500 },
    );
  }
}
