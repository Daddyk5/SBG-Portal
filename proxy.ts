import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Without Supabase configured, send /admin to a helpful setup message instead of crashing.
  if (!isSupabaseConfigured) {
    return new NextResponse(
      "Supabase is not configured. Copy .env.example to .env.local and fill in your project URL and publishable key.",
      { status: 503 },
    );
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/member/:path*"],
};
