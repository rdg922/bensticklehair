import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('feature_flags')
      .select('flag_name, is_enabled');

    if (error) {
      console.error('Error fetching feature flags:', error);
      return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
    }

    // Convert to key-value object for easier access
    const flags = data.reduce((acc, flag) => {
      acc[flag.flag_name] = flag.is_enabled;
      return acc;
    }, {} as Record<string, boolean>);

    return NextResponse.json(flags);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
