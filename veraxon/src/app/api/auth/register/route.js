import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { signToken, COOKIE_OPTIONS } from '@/lib/auth';

// RFC 5322-compliant email regex (simplified but robust)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 *
 * Registers a new user with email/password.
 * - Validates email format and password length
 * - Creates the user in Firebase Auth (enables Google OAuth coexistence)
 * - Hashes the password with bcrypt (10 salt rounds) and stores in Firestore
 * - Returns a JWT session token in an HTTP-only cookie
 *
 * Response format: { success, data, error, timestamp }
 */
export async function POST(req) {
  const timestamp = new Date().toISOString();

  try {
    const body = await req.json();
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
      subjectHandling,
    } = body;

    // ── Input presence validation ──────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Please provide name, email, and password',
          timestamp,
        },
        { status: 400 }
      );
    }

    // ── Email format validation ────────────────────────────────────────────
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Invalid email format',
          timestamp,
        },
        { status: 400 }
      );
    }

    // ── Password length validation ─────────────────────────────────────────
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Password must be at least 8 characters long',
          timestamp,
        },
        { status: 400 }
      );
    }

    // ── Normalise role ─────────────────────────────────────────────────────
    const normalizedRole =
      role === 'admin' ? 'admin' : role === 'staff' ? 'staff' : 'student';

    // ── Create user in Firebase Auth ───────────────────────────────────────
    // This allows the same account to later link Google OAuth.
    let firebaseUser;
    try {
      firebaseUser = await getAdminAuth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: false,
      });
    } catch (authError) {
      // Firebase Auth error codes: https://firebase.google.com/docs/auth/admin/errors
      if (
        authError.code === 'auth/email-already-exists' ||
        authError.code === 'auth/email-already-in-use'
      ) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: 'Email is already registered',
            timestamp,
          },
          { status: 409 }
        );
      }
      throw authError; // re-throw unexpected errors
    }

    const uid = firebaseUser.uid;

    // ── Hash password with bcrypt (min 10 salt rounds) ─────────────────────
    const passwordHash = await bcrypt.hash(password, 10);

    // ── Persist user profile in Firestore ─────────────────────────────────
    const db = getAdminFirestore();
    const now = new Date().toISOString();

    const userRecord = {
      uid,
      name,
      email,
      passwordHash,
      role: normalizedRole,
      collegeName: collegeName || null,
      department: department || null,
      year: year || null,
      registerNumber: registerNumber || null,
      staffId: staffId || null,
      subjectHandling: subjectHandling || null,
      status: 'active',
      preferences: {
        theme: 'dark',
        notifications: true,
        emailNotifications: true,
      },
      createdAt: now,
      updatedAt: now,
      lastLogin: null,
    };

    await db.collection('users').doc(uid).set(userRecord);

    // ── Set custom claims on Firebase Auth token (role) ────────────────────
    await getAdminAuth().setCustomUserClaims(uid, { role: normalizedRole });

    // ── Generate JWT session token ─────────────────────────────────────────
    const token = signToken({
      id: uid,
      name,
      email,
      role: normalizedRole,
    });

    // ── Set HTTP-only session cookie ───────────────────────────────────────
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_OPTIONS.name, token, {
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
      maxAge: COOKIE_OPTIONS.maxAge / 1000, // cookies() maxAge is in seconds
      path: COOKIE_OPTIONS.path,
    });

    // ── Success response ───────────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: uid,
            name,
            email,
            role: normalizedRole,
          },
        },
        error: null,
        timestamp,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration Route Error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'Internal server error during registration',
        timestamp,
      },
      { status: 500 }
    );
  }
}
