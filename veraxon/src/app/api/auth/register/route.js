import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signToken, COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(req) {
  try {
    await dbConnect();
    const {
      name,
      email,
      password,
      role,
      collegeName,
      department,
      year,
      registerNumber,
      staffId,
      subjectHandling
    } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide name, email, and password' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 400 }
      );
    }

    // Create user. Mongoose model pre-save hook handles password hashing automatically.
    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : (role === 'staff' ? 'staff' : 'student'),
      collegeName,
      department,
      year,
      registerNumber,
      staffId,
      subjectHandling
    });

    // Create session token
    const token = signToken({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_OPTIONS.name, token, {
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
      maxAge: COOKIE_OPTIONS.maxAge / 1000, // standard cookies() maxAge is in seconds
      path: COOKIE_OPTIONS.path,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
