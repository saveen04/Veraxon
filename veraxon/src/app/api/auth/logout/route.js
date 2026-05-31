import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_OPTIONS } from '@/lib/auth';

export async function POST() {
  try {
    // Clear token by setting cookie age to 0
    cookies().set(COOKIE_OPTIONS.name, '', {
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
      maxAge: 0,
      path: COOKIE_OPTIONS.path,
    });

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during logout' },
      { status: 500 }
    );
  }
}
