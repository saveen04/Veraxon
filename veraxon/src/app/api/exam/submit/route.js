import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import Attempt from '@/models/Attempt';
import Result from '@/models/Result';

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

    // 1. Fetch the exam with the correct answers (only retrieved securely on backend)
    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // 2. Grade the attempt
    let calculatedScore = 0;
    let totalMarks = 0;

    exam.questions.forEach((question, idx) => {
      totalMarks += question.marks || 1;
      const studentAnswer = answers[idx];
      
      // If student choice matches correct answer index
      if (studentAnswer !== undefined && studentAnswer === question.correctAnswer) {
        calculatedScore += question.marks || 1;
      }
    });

    const percentage = totalMarks > 0 ? Math.round((calculatedScore / totalMarks) * 100) : 0;
    const passed = percentage >= 40; // 40% passing score threshold

    // 3. Record the final Result
    const result = await Result.create({
      studentId,
      examId,
      score: calculatedScore,
      totalMarks,
      percentage,
      passed,
      createdAt: new Date()
    });

    // 4. Update the Attempt state to submitted
    await Attempt.findOneAndUpdate(
      { examId, studentId, status: 'started' },
      { 
        answers,
        status: 'submitted',
        endTime: new Date()
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      score: calculatedScore,
      totalMarks,
      percentage,
      passed,
      resultId: result._id
    });
  } catch (error) {
    console.error('Submit Exam API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during exam evaluation' },
      { status: 500 }
    );
  }
}
