// File: app/components/Navbar.tsx
// PENTING: Ini adalah Client Component karena perlu state dan interaksi
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        // 1. Cek sesi yang sedang berjalan saat komponen pertama kali dimuat
        const getInitialSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        };

        getInitialSession();

        // 2. Dengarkan perubahan status autentikasi (login, logout) secara real-time
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
        });

        // 3. Hentikan listener saat komponen tidak lagi digunakan (cleanup)
        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Arahkan kembali ke halaman utama setelah logout
        router.push('/');
    };

    return (
        <nav className="bg-white shadow-md w-full">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                {/* Logo atau Nama Situs */}
                <Link href="/" className="text-xl font-bold text-gray-800">
                    Pusdatin Budaya Ternate
                </Link>

                {/* Menu Navigasi */}
                <div className="flex items-center space-x-4">
                    {user ? (
                        // Tampilan jika PENGGUNA SUDAH LOGIN
                        <>
                            <span className="text-gray-700 hidden sm:block">
                                Selamat datang, <span className="font-semibold">{user.email}</span>
                            </span>
                            <Link href="/kontributor/dashboard" className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300">
                                Dashboard
                            </Link>
                            <button onClick={handleLogout} className="px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">
                                Logout
                            </button>
                        </>
                    ) : (
                        // Tampilan jika PENGGUNA BELUM LOGIN
                        <>
                            <Link href="/auth/login" className="px-3 py-2 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-100">
                                Login
                            </Link>
                            <Link href="/auth/register" className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
