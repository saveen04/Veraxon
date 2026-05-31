import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Result from '@/models/Result';
import Exam from '@/models/Exam';

export async function GET(req) {
  try {
    await dbConnect();

    // Query parameters
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Find the latest result for this student, populated with the exam details
    const result = await Result.findOne({ studentId })
      .sort({ createdAt: -1 });

    if (!result) {
      return NextResponse.json({
        success: false,
        message: 'No assessment result history found.'
      });
    }

    // Load exam title
    const exam = await Exam.findById(result.examId).select('title');

    return NextResponse.json({
      success: true,
      result: {
        _id: result._id,
        examTitle: exam ? exam.title : 'Assessment Session',
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        passed: result.passed,
        createdAt: result.createdAt
      }
    });
  } catch (error) {
    console.error('Fetch Result API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during result retrieval' },
      { status: 500 }
    );
  }
}
