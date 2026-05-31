import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    await dbConnect();
    const { uid, collegeName, department, year, registerNumber, staffId, subjectHandling } = await req.json();

    if (!uid || !collegeName || !department) {
      return NextResponse.json(
        { error: 'UID, College Name and Department are required' },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      uid,
      {
        collegeName,
        department,
        year,
        registerNumber,
        staffId,
        subjectHandling
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        collegeName: updatedUser.collegeName,
        department: updatedUser.department
      }
    });
  } catch (error) {
    console.error('Update Profile API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during profile update' },
      { status: 500 }
    );
  }
}
