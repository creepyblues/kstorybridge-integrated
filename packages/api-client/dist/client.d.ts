import { SupabaseClient } from '@supabase/supabase-js';
export declare const createSupabaseClient: <DatabaseType = any>() => SupabaseClient<DatabaseType>;
export declare const supabase: SupabaseClient<any, "public", any>;
