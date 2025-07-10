import React from "react";

// Server-side feature flag check using direct database access
export async function getFeatureFlagsServer(): Promise<Record<string, boolean>> {
  try {
    // Import dynamically to avoid issues with next/headers in client components
    const { createClient } = await import("@/lib/supabase-server");
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('feature_flags')
      .select('flag_name, is_enabled');

    if (error) {
      console.warn('Feature flags not found, defaulting to false');
      return {};
    }

    return data.reduce((acc, flag) => {
      acc[flag.flag_name] = flag.is_enabled;
      return acc;
    }, {} as Record<string, boolean>);
  } catch (error) {
    console.error('Error checking feature flags:', error);
    return {};
  }
}

// Server-side single flag check
export async function isFeatureEnabled(flagName: string): Promise<boolean> {
  const flags = await getFeatureFlagsServer();
  return flags[flagName] ?? false;
}

// Client-side feature flag fetching
async function getFeatureFlagsClient(): Promise<Record<string, boolean>> {
  try {
    const response = await fetch('/api/feature-flags');
    if (!response.ok) {
      throw new Error('Failed to fetch feature flags');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return {};
  }
}

// React hook for client-side components
export function useFeatureFlag(flagName: string) {
  const [enabled, setEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getFeatureFlagsClient().then((flags) => {
      setEnabled(flags[flagName] ?? false);
      setLoading(false);
    });
  }, [flagName]);

  return { enabled, loading };
}

// Hook to get all feature flags
export function useFeatureFlags() {
  const [flags, setFlags] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getFeatureFlagsClient().then((fetchedFlags) => {
      setFlags(fetchedFlags);
      setLoading(false);
    });
  }, []);

  return { flags, loading };
}

// Available feature flags
export const FEATURE_FLAGS = {
  LIKES_VISIBLE: 'likes_visible',
  HALL_OF_FAME_VISIBLE: 'hall_of_fame_visible',
} as const;
