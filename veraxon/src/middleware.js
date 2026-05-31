import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/register', '/'];

  if (publicRoutes.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Next.js middleware doesn't easily read Firebase auth tokens without
  // setting custom cookies matching the JWT. We will check if a token cookie exists.
  // This is a foundational block; in a real Next.js+Firebase SSR app, we would verify the JWT here.
  const authCookie = request.cookies.get('firebaseAuthToken');
  const userRole = request.cookies.get('userRole')?.value;

  if (!authCookie) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from public landing pages if they have a role
  if (pathname === '/' && userRole) {
    const dashboard = userRole === 'staff' || userRole === 'admin' ? '/staff/dashboard' : '/student/dashboard';
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Role Based Routing checks
  if (pathname.startsWith('/staff') && userRole !== 'staff' && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  if (pathname.startsWith('/student') && userRole !== 'student' && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/staff/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
