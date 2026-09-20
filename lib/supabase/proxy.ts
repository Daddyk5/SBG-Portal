import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

/**
 * Refreshes the Supabase auth cookies on every matched request and redirects
 * unauthenticated visitors away from /admin and /member. This is an optimistic check only —
 * every admin page and Server Action re-verifies the session (see lib/auth.ts)
 * and RLS is the real security boundary.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL!,
    SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  const area = pathname.startsWith("/member") ? "member" : "admin";
  const isLogin = pathname === `/${area}/login`;

  if (!isSignedIn && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = `/${area}/login`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
