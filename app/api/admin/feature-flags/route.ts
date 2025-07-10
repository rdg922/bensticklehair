import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { flagName, enabled } = await request.json();

    if (!flagName || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. flagName and enabled (boolean) are required.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update the feature flag
    const { error } = await supabase
      .from('feature_flags')
      .update({ 
        is_enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('flag_name', flagName);

    if (error) {
      console.error('Error updating feature flag:', error);
      return NextResponse.json(
        { error: 'Failed to update feature flag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Feature flag ${flagName} ${enabled ? 'enabled' : 'disabled'}` 
    });

  } catch (error) {
    console.error('Error in feature flag API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: flags, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('flag_name');

    if (error) {
      console.error('Error fetching feature flags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feature flags' },
        { status: 500 }
      );
    }

    return NextResponse.json({ flags });

  } catch (error) {
    console.error('Error in feature flag API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
