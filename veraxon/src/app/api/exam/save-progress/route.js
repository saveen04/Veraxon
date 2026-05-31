import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Attempt from '@/models/Attempt';

export async function POST(req) {
  try {
    await dbConnect();
    const { examId, studentId, answers } = await req.json();

    if (!examId || !studentId || !answers) {
      return NextResponse.json(
        { error: 'Please provide examId, studentId, and answers array' },
        { status: 400 }
      );
    }

    // Find if attempt already exists, otherwise create it (upsert progress)
    const attempt = await Attempt.findOneAndUpdate(
      { examId, studentId, status: 'started' },
      { 
        answers, 
        startTime: new Date() // Updates or preserves start details
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Assessment progress saved successfully',
      attemptId: attempt._id
    });
  } catch (error) {
    console.error('Save Progress Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during progress saving' },
      { status: 500 }
    );
  }
}
