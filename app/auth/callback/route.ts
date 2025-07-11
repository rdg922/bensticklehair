import { createClient } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/";

  console.log("Auth callback received:", {
    code: !!code,
    error,
    errorDescription,
    origin,
  });

  if (error) {
    console.error("OAuth callback error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    console.log("Exchanging code for session...");

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data.user) {
      console.log("Successfully authenticated user:", data.user.id);

      // Check if user profile exists, if not create one
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingUser) {
        console.log("Creating new user profile...");
        // Create user profile with Google display name
        const { error: insertError } = await supabase.from("users").insert({
          id: data.user.id,
          name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split("@")[0] ||
            "Anonymous",
        });

        if (insertError) {
          console.error("Error creating user profile:", insertError);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Code exchange error:", exchangeError);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=exchange_failed`
      );
    }
  }

  console.error("No authorization code received");
  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`);
}
