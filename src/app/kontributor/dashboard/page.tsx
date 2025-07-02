// File: src/app/kontributor/dashboard/page.tsx

// 1. Tandai sebagai Client Component di baris paling atas
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // 2. Ganti import ke 'next/navigation'
import { supabase } from '@/lib/supabaseClient'; // Menggunakan alias '@' lebih rapi
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Cukup satu state loading
    const [myPosts, setMyPosts] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const checkSessionAndFetchPosts = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                // Jika tidak ada sesi, paksa kembali ke halaman login
                router.push('/auth/login');
                return; // Hentikan eksekusi lebih lanjut
            } else {
                setUser(session.user);
                // Setelah user didapat, fetch postingan
                try {
                    const response = await fetch('/api/kontributor/my-posts', {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Gagal mengambil data kontribusi');
                    }

                    const data = await response.json();
                    setMyPosts(data);
                } catch (error) {
                    console.error(error);
                    // Mungkin tampilkan pesan error ke pengguna
                } finally {
                    setIsLoading(false); // Selesai loading setelah semua data (user & post) diambil
                }
            }
        };

        checkSessionAndFetchPosts();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Memuat data dashboard...</p>
            </div>
        );
    }

    if (user) {
        return (
            <main className="container mx-auto p-8">
                <h1 className="text-3xl font-bold">Dashboard Kontributor</h1>
                <p className="mt-2">
                    Selamat datang kembali, <span className="font-semibold">{user.email}</span>!
                </p>
                <div className="mt-8">
                    {/* <h1>Daftar Kontribusi Anda</h1> */}
                    <p>Di sini Anda akan dapat melihat status kontribusi Anda dan menambahkan data baru.</p>
                    <ul>
                        {myPosts.map((post: any) => (
                            <li key={post.id}>
                                {post.title.rendered} - <strong>Status: {post.status}</strong>
                                {/* Tambahkan tombol Edit di sini */}
                            </li>
                        ))}
                    </ul>
                    {/* Tambahkan link atau komponen lain di sini */}
                </div>
            </main>
        );
    }

    // Fallback jika terjadi sesuatu yang tidak terduga
    return null;
}
