import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ViolationReport from '@/models/ViolationReport';

export async function POST(req) {
  try {
    await dbConnect();
    const { examId, studentId, type, evidence } = await req.json();

    if (!examId || !studentId || !type) {
      return NextResponse.json(
        { error: 'Please provide examId, studentId, and violation type' },
        { status: 400 }
      );
    }

    // Save violation report in MongoDB
    const report = await ViolationReport.create({
      studentId,
      examId,
      type,
      evidence,
      timestamp: new Date()
    });

    console.log(`[PROCTORING ALERT] Violation '${type}' saved for student ${studentId} on exam ${examId}`);

    return NextResponse.json({
      success: true,
      reportId: report._id,
      message: 'Violation recorded successfully'
    });
  } catch (error) {
    console.error('Proctoring Logger Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during violation logging' },
      { status: 500 }
    );
  }
}
