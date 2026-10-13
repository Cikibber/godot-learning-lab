import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Invitation and recovery links land here; the token is verified server-side
// and the user is sent to set a password. Only same-site paths are allowed.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const target = new URL("/account/password", request.url);
  if (token_hash && (type === "invite" || type === "recovery" || type === "email")) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const res = NextResponse.redirect(target);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  }
  return NextResponse.redirect(new URL("/sign-in?link=invalid", request.url));
}
