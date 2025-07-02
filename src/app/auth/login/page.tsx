import { supabase } from '@/lib/supabaseClient';

interface LoginCredentials {
    email: string;
    password: string;
}

interface SupabaseAuthResponse {
    data: unknown;
    error: { message: string } | null;
}

async function handleLogin(email: string, password: string): Promise<void> {
    try {
        const { data, error }: SupabaseAuthResponse = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        } as LoginCredentials);
        if (error) throw error;
        // Arahkan pengguna ke dashboard setelah login berhasil
        window.location.href = '/kontributor/dashboard';
    } catch (error: any) {
        alert(error.message);
    }
}
