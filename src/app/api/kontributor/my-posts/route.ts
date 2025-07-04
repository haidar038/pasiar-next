/*
================================================================================
File 1: API Route untuk Mengambil Postingan Kontributor (Backend)
Lokasi: src/app/api/kontributor/my-posts/route.ts
Deskripsi: Versi ini telah dioptimalkan untuk mengambil data dari SEMUA 
Custom Post Types (CPT) dan menggabungkannya menjadi satu daftar.
Ganti seluruh isi file lama Anda dengan kode ini.
================================================================================
*/

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Daftar semua slug CPT yang ingin kita ambil datanya
const CPT_SLUGS = ["cagar_budaya", "kesenian", "tokoh", "komunitas", "tradisi_lokal"];

export async function GET(request: Request) {
    try {
        // 1. Validasi token Supabase untuk mendapatkan user ID
        const token = request.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ message: "Token tidak ditemukan" }, { status: 401 });
        }

        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json({ message: "Token tidak valid" }, { status: 401 });
        }

        // 2. Dapatkan token otentikasi dari WordPress
        const wpApiUser = process.env.WORDPRESS_API_USER;
        const wpApiPass = process.env.WORDPRESS_API_PASS;
        const wpApiUrl = process.env.WORDPRESS_API_URL;

        if (!wpApiUser || !wpApiPass || !wpApiUrl) {
            console.error("Kredensial WordPress API tidak lengkap di .env");
            return NextResponse.json({ message: "Konfigurasi server tidak lengkap" }, { status: 500 });
        }

        const tokenResponse = await fetch(`${wpApiUrl}/jwt-auth/v1/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: wpApiUser, password: wpApiPass }),
        });

        if (!tokenResponse.ok) {
            throw new Error("Gagal mendapatkan token otentikasi WordPress.");
        }
        const tokenData = await tokenResponse.json();
        const jwtToken = tokenData.token;

        // 3. Ambil data dari SEMUA CPT secara paralel
        const fetchPromises = CPT_SLUGS.map((slug) =>
            fetch(`${wpApiUrl}/wp/v2/${slug}?per_page=100&status=publish,pending,draft&context=edit`, {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
            }).then((res) => res.json())
        );

        const results = await Promise.all(fetchPromises);

        // Gabungkan semua hasil menjadi satu array
        const allPosts = results.flat();

        // 4. Filter postingan yang cocok dengan ID pengguna
        const myPosts = allPosts.filter((post: any) => post.acf?.supabase_user_id === user.id);

        return NextResponse.json(myPosts, { status: 200 });
    } catch (error: any) {
        console.error("API Error in my-posts:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
