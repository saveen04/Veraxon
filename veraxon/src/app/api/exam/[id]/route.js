import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    // Query exam, projecting out the correctAnswer fields for security
    const exam = await Exam.findById(id).select('title duration questions.text questions.options questions.marks createdBy');
    
    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      exam
    });
  } catch (error) {
    console.error('Fetch Exam API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during exam retrieval' },
      { status: 500 }
    );
  }
}
