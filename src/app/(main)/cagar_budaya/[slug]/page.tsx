/*
================================================================================
File: Halaman Detail Cagar Budaya (dengan Penjelasan Lengkap)
Lokasi: src/app/(main)/cagar-budaya/[slug]/page.tsx
Deskripsi: Kode ini telah diperbarui dengan komentar untuk menjelaskan
           setiap langkah dalam proses pengambilan data dinamis.
================================================================================
*/
import { notFound } from "next/navigation";
import { getPostBySlug, getAllSlugsForCpt } from "@/lib/wordpress";
import BudayaDetail from "@/app/components/BudayaDetail";

// 1. Kita definisikan CPT Slug untuk halaman ini.
//    Ini memberitahu helper kita untuk mencari di "rak buku" yang benar.
const CPT_SLUG = "cagar_budaya";

/**
 * FUNGSI INI (generateStaticParams) BERTUGAS MENGAMBIL SEMUA "POST SLUG"
 * Ia pergi ke WordPress dan berkata, "Tolong berikan saya semua 'judul unik'
 * (seperti 'sasadu', 'benteng-kalamata') yang ada di rak 'cagar_budaya'."
 * Next.js kemudian menggunakan daftar ini untuk membuat halaman statis saat build.
 */
export async function generateStaticParams() {
    // Memanggil helper untuk mengambil semua Post Slug dari CPT 'cagar_budaya'
    const posts = await getAllSlugsForCpt(CPT_SLUG);

    // Jika gagal mengambil data, kembalikan array kosong agar tidak error.
    if (!posts) {
        return [];
    }

    // Mapping hasilnya ke format yang dibutuhkan oleh Next.js
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

// Ini adalah komponen halaman utama.
// 'params.slug' akan berisi "Post Slug" yang diambil dari URL.
// Contoh: jika URL adalah /cagar-budaya/sasadu, maka params.slug akan berisi "sasadu".
export default async function CagarBudayaDetailPage({ params }: { params: { slug: string } }) {
    /**
     * DI SINI KITA MENGAMBIL DATA SPESIFIK UNTUK SATU POSTINGAN
     * Kita memanggil helper dan berkata, "Tolong ambilkan saya data lengkap
     * dari rak 'cagar_budaya' yang memiliki judul unik (Post Slug) '${params.slug}'."
     */
    const post = await getPostBySlug(CPT_SLUG, params.slug);

    // Jika helper tidak menemukan data (misalnya slug salah),
    // maka tampilkan halaman 404 standar dari Next.js.
    if (!post) {
        notFound();
    }

    // Jika data ditemukan, tampilkan menggunakan komponen BudayaDetail.
    return <BudayaDetail post={post} />;
}
