import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = "https://dlrnrgcoguxlkkcitlpd.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtra2NpdGxwZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzIxMzAzNzEyLCJleHAiOjIwMzY4Nzk3MTJ9.0YHIhCUWUZT7bYQ9PDa7cE3KJbsw-YJy_b_-SzU4n4w"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)