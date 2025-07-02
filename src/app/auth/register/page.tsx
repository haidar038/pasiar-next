import { supabase } from '@/lib/supabaseClient';

interface RegisterCredentials {
    email: string;
    password: string;
}

async function handleRegister(email: RegisterCredentials['email'], password: RegisterCredentials['password']): Promise<void> {
    try {
        const { data, error }: { data: unknown; error: Error | null } = await supabase.auth.signUp({
            email: email,
            password: password,
        });
        if (error) throw error;
        alert('Registrasi berhasil! Silakan login.');
    } catch (error: any) {
        alert(error.message);
    }
}
