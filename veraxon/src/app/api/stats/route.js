import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const db = getAdminFirestore();

    // Get partitioning params from search query
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const collegeName = searchParams.get("collegeName");

    // 1. Fetch available exams within partition
    let examsRef = db.collection("exams");
    if (collegeName)
      examsRef = examsRef.where("collegeName", "==", collegeName);
    if (department) examsRef = examsRef.where("department", "==", department);
    const examSnapshot = await examsRef.get();
    const exams = examSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 2. Counts within partition
    let usersRef = db.collection("users").where("role", "==", "student");
    if (collegeName)
      usersRef = usersRef.where("collegeName", "==", collegeName);
    if (department) usersRef = usersRef.where("department", "==", department);
    const candidatesSnapshot = await usersRef.get();
    const candidatesCount = candidatesSnapshot.size;
    const examsCount = exams.length;

    // For attempts, we filter by exams within the partition
    const examIds = exams.map((e) => e.id);
    let attemptsSnapshot;
    if (examIds.length > 0) {
      // Chunk of 10 limit for Firestore 'in' query
      attemptsSnapshot = await db
        .collection("attempts")
        .where("examId", "in", examIds.slice(0, 10))
        .get();
    } else {
      attemptsSnapshot = { docs: [], size: 0 };
    }
    const attemptsCount = attemptsSnapshot.size;
    const allAttempts = attemptsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 3. Fetch recent activity (Violation Reports) filtered by examIds
    let infractionsSnapshot;
    if (examIds.length > 0) {
      infractionsSnapshot = await db
        .collection("infractions")
        .where("examId", "in", examIds.slice(0, 10))
        .get();
    } else {
      infractionsSnapshot = { docs: [] };
    }

    const sortedInfractions = infractionsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const activityFeed = sortedInfractions.slice(0, 15).map((inf) => ({
      _id: inf.id,
      studentName: inf.studentName || "Unknown Student",
      examTitle:
        exams.find((e) => e.id === inf.examId)?.title || "Assessment Session",
      type: inf.type,
      timestamp: inf.timestamp,
      evidence: inf.evidence ? "Snapshot Available" : "Metadata Logs",
    }));

    // 4. Fetch attempts list for Kanban Board within partition
    const attemptsList = [];
    for (let attempt of allAttempts) {
      const matchingExam = exams.find((e) => e.id === attempt.examId);
      const studentInfractionsCount = sortedInfractions.filter(
        (inf) =>
          inf.studentId === attempt.studentId && inf.examId === attempt.examId,
      ).length;

      attemptsList.push({
        _id: attempt.id,
        studentId: attempt.studentId,
        studentName: attempt.studentName || "Unknown Candidate",
        studentEmail: attempt.studentEmail || "",
        examId: attempt.examId,
        examTitle: matchingExam ? matchingExam.title : "Assessment Session",
        status: attempt.status,
        startTime: attempt.startTime,
        violationCount: studentInfractionsCount,
      });
    }

    let integrityScore = 98;
    if (attemptsCount > 0) {
      const totalViolationsCount = sortedInfractions.length;
      const deductions = totalViolationsCount * 2;
      integrityScore = Math.max(70, 100 - deductions);
    }

    return NextResponse.json({
      success: true,
      exams,
      candidatesCount,
      examsCount,
      attemptsCount,
      integrityScore,
      recentActivity: activityFeed,
      attempts: attemptsList,
    });
  } catch (error) {
    console.error("Stats Retrieval API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve system statistics",
      },
      { status: 500 },
    );
  }
}
