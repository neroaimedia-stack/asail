import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/admin", "/business", "/creator", "/messages", "/settings"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function redirectToLogin(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/auth/login";
  redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

export async function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectToLogin(request);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToLogin(request);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("deleted_at, role, suspended_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.deleted_at) {
    return redirectToLogin(request);
  }

  if (profile?.suspended_at) {
    const suspendedUrl = request.nextUrl.clone();
    suspendedUrl.pathname = "/suspended";
    suspendedUrl.search = "";
    return NextResponse.redirect(suspendedUrl);
  }

  if (
    (request.nextUrl.pathname === "/admin" ||
      request.nextUrl.pathname.startsWith("/admin/")) &&
    profile?.role !== "admin"
  ) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/business/:path*",
    "/creator/:path*",
    "/messages/:path*",
    "/settings/:path*",
  ],
};
