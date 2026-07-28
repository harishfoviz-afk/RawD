// src/lib/db.ts
import { createClient } from "@supabase/supabase-js";

let supabaseUrl = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  "https://placeholder-project-ref.supabase.co"
).trim();

let supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  "placeholder-anon-key"
).trim();

// Strip surrounding quotes if present (common copy-paste mistake)
if (supabaseUrl.startsWith('"') && supabaseUrl.endsWith('"')) supabaseUrl = supabaseUrl.slice(1, -1);
if (supabaseUrl.startsWith("'") && supabaseUrl.endsWith("'")) supabaseUrl = supabaseUrl.slice(1, -1);
if (supabaseAnonKey.startsWith('"') && supabaseAnonKey.endsWith('"')) supabaseAnonKey = supabaseAnonKey.slice(1, -1);
if (supabaseAnonKey.startsWith("'") && supabaseAnonKey.endsWith("'")) supabaseAnonKey = supabaseAnonKey.slice(1, -1);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
