import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('Warning: JWT_SECRET environment variable is missing. Sessions will use an unstable fallback key.');
}

const SECRET = JWT_SECRET || 'veraxon_super_secret_fallback_2026_key';

/**
 * Signs a payload to generate a JWT token
 * @param {object} payload - The user details (e.g. { id, email, role })
 * @returns {string} Signed JWT token string
 */
export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

/**
 * Verifies a JWT token
 * @param {string} token - The signed JWT token string
 * @returns {object|null} Decoded payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Shared HTTP-only cookie options for JWT sessions
 */
export const COOKIE_OPTIONS = {
  name: 'veraxon_session',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};
