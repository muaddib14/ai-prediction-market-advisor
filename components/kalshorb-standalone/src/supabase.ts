import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hczrquegpsgehiglprqq.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key_here'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Edge function invocation helper
export async function invokeEdgeFunction<T = any>(
  functionName: string, 
  payload: Record<string, any> = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    })
    
    if (error) {
      console.error('Edge function error:', error)
      return { error: error.message }
    }
    
    return { data }
  } catch (err) {
    console.error('Function invocation failed:', err)
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}