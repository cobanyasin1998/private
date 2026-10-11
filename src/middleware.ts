import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/learning", "/movies", "/books", "/finance", "/courses", "/tasks", "/projects", "/notes", "/habits", "/goals", "/subscriptions", "/settings"];

export function middleware(request: NextRequest) {
  if (!protectedPrefixes.some((prefix) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`))) return NextResponse.next();
  if (request.cookies.has("lifeos_session")) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
