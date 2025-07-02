// File: src/app/api/kontributor/my-posts/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    try {
        // Ambil token dari header Authorization
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });
        }

        // Validasi token dengan Supabase untuk mendapatkan user
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json({ message: 'Token tidak valid' }, { status: 401 });
        }

        // --- MULAI PERUBAHAN ---
        // Menggunakan autentikasi JWT, sama seperti pada API submit-cagar-budaya

        // 1. Ambil kredensial dari environment variables
        const wpApiUser = process.env.WORDPRESS_API_USER;
        const wpApiPass = process.env.WORDPRESS_API_PASS;

        if (!wpApiUser || !wpApiPass) {
            console.error('Kredensial WordPress API (WORDPRESS_API_USER/PASS) tidak ditemukan di .env');
            return NextResponse.json({ message: 'Konfigurasi server tidak lengkap' }, { status: 500 });
        }

        // 2. Dapatkan token JWT dari WordPress
        const wpApiUrl = process.env.WORDPRESS_API_URL;
        const tokenResponse = await fetch(`${wpApiUrl}/jwt-auth/v1/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: wpApiUser, password: wpApiPass }),
        });

        if (!tokenResponse.ok) {
            throw new Error('Gagal mendapatkan token otentikasi dari WordPress.');
        }
        const tokenData = await tokenResponse.json();
        const jwtToken = tokenData.token;

        // 3. Ambil data post menggunakan token JWT
        // Parameter `status` dan `context` tetap diperlukan untuk mengambil post yang belum di-publish.
        const res = await fetch(`${wpApiUrl}/wp/v2/cagar_budaya?per_page=100&status=publish,pending,draft&context=edit`, {
            headers: {
                Authorization: `Bearer ${jwtToken}`,
            },
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('Error fetching from WordPress:', errorData);
            return NextResponse.json({ message: 'Gagal mengambil data dari WordPress', error: errorData }, { status: res.status });
        }

        // --- SELESAI PERUBAHAN ---

        const allPosts = await res.json();

        // Filter postingan yang cocok dengan ID pengguna
        const myPosts = allPosts.filter((post: any) => post.acf?.supabase_user_id === user.id);

        return NextResponse.json(myPosts, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
