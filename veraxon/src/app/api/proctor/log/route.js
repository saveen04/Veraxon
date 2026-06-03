import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(req) {
  try {
    const { examId, studentId, type, evidence, studentName, severity } =
      await req.json();

    if (!examId || !studentId || !type) {
      return NextResponse.json(
        { error: "Please provide examId, studentId, and violation type" },
        { status: 400 },
      );
    }

    const db = getAdminFirestore();

    const reportRef = await db.collection("infractions").add({
      examId,
      studentId,
      studentName: studentName || "Unknown Student",
      type,
      evidence: evidence || null,
      severity: severity || "warning",
      timestamp: new Date().toISOString(),
    });

    console.log(
      `[PROCTORING ALERT] Violation '${type}' saved for student ${studentId} on exam ${examId}`,
    );

    return NextResponse.json({
      success: true,
      reportId: reportRef.id,
      message: "Violation recorded successfully",
    });
  } catch (error) {
    console.error("Proctoring Logger Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error during violation logging" },
      { status: 500 },
    );
  }
}
