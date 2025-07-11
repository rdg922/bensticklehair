import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!url || !anonKey) {
      console.error("Missing Supabase environment variables:", {
        url: !!url,
        anonKey: !!anonKey,
      });
      throw new Error("Missing Supabase environment variables");
    }

    console.log(
      "Creating Supabase client with URL:",
      url.substring(0, 20) + "..."
    );

    supabaseClient = createBrowserClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseClient;
}
