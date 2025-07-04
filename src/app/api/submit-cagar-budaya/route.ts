// File: src/app/api/submit-cagar-budaya/route.ts
// Menggunakan sintaks App Router - VERSI EKSPLISIT & AMAN

import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // --- Langkah 1: Membangun Objek ACF secara Eksplisit ---
        // Kita akan membuat objek acfFields secara manual untuk memastikan
        // semua data yang ada di-mapping dengan benar ke nama field snake_case.
        const acfFields: { [key: string]: any } = {};

        // Mapping dari camelCase (frontend) ke snake_case (WordPress ACF)
        // Hanya tambahkan field jika nilainya ada (tidak null/kosong)
        if (body.lokasi) acfFields.lokasi = body.lokasi;
        if (body.nilaiSejarah) acfFields.nilai_sejarah = body.nilaiSejarah;
        if (body.nilaiBudaya) acfFields.nilai_budaya = body.nilaiBudaya;
        if (body.sumberInformasi) acfFields.sumber_informasi = body.sumberInformasi;
        if (body.jenisBangunan) acfFields.jenis_bangunan = body.jenisBangunan;
        if (body.usiaBangunan) acfFields.usia_bangunan = body.usiaBangunan;
        if (body.kondisiBangunan) acfFields.kondisi_bangunan = body.kondisiBangunan;
        if (body.nilaiArsitektur) acfFields.nilai_arsitektur = body.nilaiArsitektur;
        if (body.jenisSitus) acfFields.jenis_situs = body.jenisSitus;
        if (body.luasSitus) acfFields.luas_situs = body.luasSitus;
        if (body.kondisiSitus) acfFields.kondisi_situs = body.kondisiSitus;
        if (body.jenisKawasan) acfFields.jenis_kawasan = body.jenisKawasan;
        if (body.luasKawasan) acfFields.luas_kawasan = body.luasKawasan;
        if (body.kondisiKawasan) acfFields.kondisi_kawasan = body.kondisiKawasan;
        if (body.jenisBenda) acfFields.jenis_benda = body.jenisBenda;
        if (body.deskripsiBenda) acfFields.deskripsi_benda = body.deskripsiBenda;
        if (body.tahunPenemuan) acfFields.tahun_penemuan = body.tahunPenemuan;
        if (body.kondisiBenda) acfFields.kondisi_benda = body.kondisiBenda;
        if (body.jenisStruktur) acfFields.jenis_struktur = body.jenisStruktur;
        if (body.deskripsiStruktur) acfFields.deskripsi_struktur = body.deskripsiStruktur;
        if (body.tahunDibangun) acfFields.tahun_dibangun = body.tahunDibangun;
        if (body.kondisiStruktur) acfFields.kondisi_struktur = body.kondisiStruktur;
        if (body.userId) acfFields.supabase_user_id = body.userId;

        // --- Langkah 2: Otentikasi ke WordPress ---
        const user = process.env.WORDPRESS_API_USER;
        const pass = process.env.WORDPRESS_API_PASS;

        if (!user || !pass) {
            throw new Error("Kredensial WordPress tidak ditemukan di environment variables.");
        }

        const wpApiUrl = process.env.WORDPRESS_API_URL;
        const tokenResponse = await fetch(`${wpApiUrl}/jwt-auth/v1/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass }),
        });

        if (!tokenResponse.ok) {
            const errorDetails = await tokenResponse.text();
            throw new Error(`Gagal mendapatkan token otentikasi. Detail: ${errorDetails}`);
        }
        const tokenData = await tokenResponse.json();
        const token = tokenData.token;

        // --- Langkah 3: Kirim data ke WordPress dengan Objek ACF yang Sudah Dibangun ---
        const createPostResponse = await fetch(`${wpApiUrl}/wp/v2/cagar_budaya`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                title: body.title,
                status: "pending",
                fields: acfFields, // PENTING: Gunakan 'fields' bukan 'acf' untuk plugin JWT
            }),
        });

        if (!createPostResponse.ok) {
            const errorData = await createPostResponse.json();
            throw new Error(`Gagal mengirim data ke WordPress: ${JSON.stringify(errorData)}`);
        }

        const postData = await createPostResponse.json();

        return NextResponse.json({ message: "Data berhasil dikirim untuk ditinjau!", data: postData }, { status: 201 });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ message: error.message || "Terjadi kesalahan pada server" }, { status: 500 });
    }
}
