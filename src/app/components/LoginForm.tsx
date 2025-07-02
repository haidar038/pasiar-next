// File: app/components/LoginForm.tsx
// PENTING: Ini adalah Client Component karena interaktif (menggunakan state dan event handler)
'use client';

import { useState } from 'react';
// Impor klien Supabase yang sudah kita buat
import { supabase } from '@/lib/supabaseClient';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('Mencoba login...');
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            setMessage('Login berhasil! Anda bisa diarahkan ke halaman dashboard sekarang.');
            // window.location.href = '/kontributor/dashboard'; // Aktifkan ini jika halaman dashboard sudah ada
        } catch (error: any) {
            setMessage(`Login gagal: ${error.message}`);
        }
    };

    return (
        <form onSubmit={handleLogin} className="max-w-sm border p-6 rounded-lg">
            <div className="mb-4">
                <label className="block mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div className="mb-4">
                <label className="block mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Login
            </button>
            {message && <p className="mt-4 text-sm">{message}</p>}
        </form>
    );
}
