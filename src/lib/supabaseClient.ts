import { createClient } from "@supabase/supabase-js";

// Mengambil URL dan kunci anon dari environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Memastikan variabel environment ada sebelum membuat klien
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Variabel environment untuk Supabase belum diatur.");
}

// Membuat dan mengekspor satu instance klien Supabase untuk digunakan di seluruh aplikasi
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
