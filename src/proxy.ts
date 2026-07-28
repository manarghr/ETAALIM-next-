import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs on every request, on the server, BEFORE any page renders.
// Two jobs:
//   1. Refresh the Supabase session cookies so a logged-in user STAYS logged in
//      across page loads (this is the piece @supabase/ssr requires).
//   2. Turn away visitors who have no business on a private page — before the
//      page is sent, instead of letting it render and redirect from the browser.
//
// This is a *gate*, not the wall. The wall is Row Level Security in Postgres:
// even if someone bypassed this file entirely, the database still refuses to
// hand them another user's rows. See security-process.md §1.
//
// (In Next 16 this file convention is named `proxy`; `middleware` is deprecated.)

// Pages that require *some* signed-in user.
const PRIVATE_PREFIXES = ["/dashboard", "/mentor-dashboard", "/welcome"];

// …plus checkout: /courses/<id>/checkout. Paying requires an account, so send
// people to the login page instead of letting them fill in a form that can
// only fail at the last click.
const CHECKOUT = /^\/courses\/[^/]+\/checkout\/?$/;

function isPrivate(pathname: string): boolean {
  return (
    PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    CHECKOUT.test(pathname)
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: this call is what refreshes the session. Use getUser(), never
  // getSession(), on the server — getUser() re-verifies the token with Supabase,
  // getSession() would trust whatever the cookie claims.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Carries the refreshed cookies onto a redirect, so bouncing someone doesn't
  // throw away a token that was just renewed.
  const redirectTo = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  // 1. Private pages: no session, no page.
  if (!user && isPrivate(pathname)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return redirectTo(login);
  }

  // 2. /admin: anyone signed in who is NOT an admin is sent home. Signed-out
  //    visitors are let through on purpose — the page renders its own sign-in
  //    form, which is how an admin gets in. The role is read from the database
  //    (the same fact `is_admin()` checks in every admin RLS policy), so this
  //    cannot be faked from the browser.
  if (user && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      return redirectTo(new URL("/", request.url));
    }
  }

  return response;
}

// Don't run on static files / images (only real pages & APIs).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
