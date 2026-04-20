import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next 16: middleware.ts is deprecated in favour of proxy.ts (Node runtime).
// This POC has no auth, but wiring the Supabase session-refresh pattern here
// now means adding real auth later is a one-line swap.
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return response;
}

export const config = {
  matcher: ["/:path*"],
};
