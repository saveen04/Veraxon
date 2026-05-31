import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Exam from '@/models/Exam';
import Attempt from '@/models/Attempt';
import ViolationReport from '@/models/ViolationReport';

export async function GET(req) {
  try {
    await dbConnect();
    
    // Get partitioning params from search query
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const collegeName = searchParams.get('collegeName');

    const filter = {};
    if (department) filter.department = department;
    if (collegeName) filter.collegeName = collegeName;

    const userFilter = { role: 'student', ...filter };
    const examFilter = { ...filter };

    // 1. Fetch available exams within partition
    const exams = await Exam.find(examFilter).sort({ createdAt: -1 });

    // 2. Counts within partition
    const candidatesCount = await User.countDocuments(userFilter);
    const examsCount = await Exam.countDocuments(examFilter);
    
    // For attempts, we filter by exams within the partition
    const examIds = exams.map(e => e._id);
    const attemptsCount = await Attempt.countDocuments({ examId: { $in: examIds } });

    // 3. Fetch recent activity (Violation Reports) filtered by examIds
    const violations = await ViolationReport.find({ examId: { $in: examIds } })
      .sort({ timestamp: -1 })
      .limit(15);

    const activityFeed = [];
    for (let violation of violations) {
      const studentObj = await User.findById(violation.studentId).select('name email');
      const examObj = await Exam.findById(violation.examId).select('title');
      
      activityFeed.push({
        _id: violation._id,
        studentName: studentObj ? studentObj.name : 'Unknown Candidate',
        examTitle: examObj ? examObj.title : 'Assessment Session',
        type: violation.type,
        timestamp: violation.timestamp,
        evidence: violation.evidence ? 'Snapshot Available' : 'Metadata Logs'
      });
    }

    // 4. Fetch attempts list for Kanban Board within partition
    const allAttempts = await Attempt.find({ examId: { $in: examIds } }).sort({ startTime: -1 });
    const attemptsList = [];
    for (let attempt of allAttempts) {
      const studentObj = await User.findById(attempt.studentId).select('name email');
      const examObj = await Exam.findById(attempt.examId).select('title');
      const violationCount = await ViolationReport.countDocuments({ studentId: attempt.studentId, examId: attempt.examId });
      
      attemptsList.push({
        _id: attempt._id,
        studentId: attempt.studentId,
        studentName: studentObj ? studentObj.name : 'Unknown Candidate',
        studentEmail: studentObj ? studentObj.email : '',
        examId: attempt.examId,
        examTitle: examObj ? examObj.title : 'Assessment Session',
        status: attempt.status,
        startTime: attempt.startTime,
        violationCount,
      });
    }

    let integrityScore = 98;
    if (attemptsCount > 0) {
      const totalViolationsCount = await ViolationReport.countDocuments({ examId: { $in: examIds } });
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
      attempts: attemptsList
    });
  } catch (error) {
    console.error('Stats Retrieval API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to retrieve system statistics' 
    }, { status: 500 });
  }
}
