// File: app/components/RegistrationForm.tsx
// PENTING: Ini adalah Client Component karena interaktif
'use client';

import { useState } from 'react';
// Impor klien Supabase yang sudah kita buat
import { supabase } from '@/lib/supabaseClient';

export default function RegistrationForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('Mendaftarkan...');
        try {
            // Fungsi untuk mendaftarkan pengguna baru di Supabase
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            setMessage('Registrasi berhasil! Silakan login menggunakan form di sebelah.');
        } catch (error: any) {
            setMessage(`Registrasi gagal: ${error.message}`);
        }
    };

    return (
        <form onSubmit={handleRegister} className="max-w-sm border p-6 rounded-lg bg-gray-50">
            <div className="mb-4">
                <label className="block mb-1 font-medium">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500" required />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500" placeholder="Minimal 6 karakter" required />
            </div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">
                Daftar Akun Baru
            </button>
            {message && <p className="mt-4 text-sm text-center">{message}</p>}
        </form>
    );
}
