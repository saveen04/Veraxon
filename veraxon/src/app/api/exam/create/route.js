import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';

export async function POST(req) {
  try {
    await dbConnect();
    const { title, duration, questions, createdBy } = await req.json();

    if (!title || !duration || !questions || !questions.length) {
      return NextResponse.json(
        { error: 'Please provide exam title, duration, and at least one question' },
        { status: 400 }
      );
    }

    // Double check questions format
    for (let q of questions) {
      if (!q.text || !q.options || q.options.length < 2 || q.correctAnswer === undefined) {
        return NextResponse.json(
          { error: 'Each question must have text, at least two options, and a correct answer index' },
          { status: 400 }
        );
      }
    }

    // Create new exam
    const exam = await Exam.create({
      title,
      duration: parseInt(duration),
      questions,
      createdBy: createdBy || '664db80f2d72f10b2cc51234', // default template ID if none provided
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Exam created successfully',
      examId: exam._id
    });
  } catch (error) {
    console.error('Create Exam API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during exam creation' },
      { status: 500 }
    );
  }
}
