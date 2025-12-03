import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hczrquegpsgehiglprqq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjenJxdWVncHNnZWhpZ2xwcnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzA4MTksImV4cCI6MjA4MDI0NjgxOX0.6xSs8lhYy01WvIesHFVMgJ9wDbENk3Yk05V2IOj1NUc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Edge function URLs
export const edgeFunctions = {
  kalshiMarkets: `${supabaseUrl}/functions/v1/kalshi-markets`,
  riskProfiling: `${supabaseUrl}/functions/v1/risk-profiling`,
  portfolioOptimizer: `${supabaseUrl}/functions/v1/portfolio-optimizer`,
  marketRecommendations: `${supabaseUrl}/functions/v1/market-recommendations`,
  aiAdvisor: `${supabaseUrl}/functions/v1/ai-advisor`,
  kalshorb: `${supabaseUrl}/functions/v1/kalshorb`,
};

// Helper function to invoke edge functions
export async function invokeEdgeFunction<T>(
  functionName: keyof typeof edgeFunctions,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const response = await fetch(edgeFunctions[functionName], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (result.error) {
      return { data: null, error: new Error(result.error.message) };
    }

    return { data: result.data as T, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
