import { NextResponse } from "next/server";

export function middleware(request) {
  // Pass-through to let React client-side logic securely manage authorization,
  // preventing edge-side cookie-sync race conditions and infinite loops.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
