/*
================================================================================
File: WordPress Helper (Mode Debug)
Lokasi: src/lib/wordpress.ts
Deskripsi: Versi ini ditambahkan banyak console.log untuk melacak alur
           data dan menemukan titik kegagalan.
================================================================================
*/

export async function getWordPressToken(): Promise<string | null> {
    console.log("1. Memulai proses getWordPressToken...");
    const wpApiUrl = process.env.WORDPRESS_API_URL;
    const user = process.env.WORDPRESS_API_USER;
    const pass = process.env.WORDPRESS_API_PASS;

    if (!wpApiUrl || !user || !pass) {
        console.error("❌ ERROR di getWordPressToken: Variabel environment tidak lengkap.");
        return null;
    }

    try {
        console.log(`   - Mengirim request ke: ${wpApiUrl}/jwt-auth/v1/token`);
        const tokenResponse = await fetch(`${wpApiUrl}/jwt-auth/v1/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass }),
        });

        if (!tokenResponse.ok) {
            console.error(`❌ ERROR di getWordPressToken: Gagal mendapatkan token. Status: ${tokenResponse.status}`);
            const errorBody = await tokenResponse.text();
            console.error("   - Detail Error dari WordPress:", errorBody);
            return null;
        }

        const tokenData = await tokenResponse.json();
        const token = tokenData?.token || null;

        if (token) {
            console.log("✅ SUCCESS di getWordPressToken: Token berhasil didapatkan.");
        } else {
            console.error("❌ ERROR di getWordPressToken: Respon OK, tapi tidak ada token di dalam data.");
        }
        return token;
    } catch (error) {
        console.error("❌ CRITICAL ERROR di getWordPressToken: Terjadi kesalahan saat fetch.", error);
        return null;
    }
}

export async function getPostBySlug(cptSlug: string, postSlug: string): Promise<any | null> {
    console.log(`\n2. Memulai getPostBySlug untuk '${postSlug}' di CPT '${cptSlug}'...`);
    const token = await getWordPressToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const statusQuery = token ? "&status=publish,pending" : "";
    const fetchUrl = `${process.env.WORDPRESS_API_URL}/wp/v2/${cptSlug}?slug=${postSlug}${statusQuery}`;

    console.log(`   - Melakukan fetch ke URL: ${fetchUrl}`);
    try {
        const res = await fetch(fetchUrl, { headers, next: { revalidate: 60 } });
        if (!res.ok) {
            console.error(`❌ ERROR di getPostBySlug: Gagal mengambil data. Status: ${res.status}`);
            return null;
        }
        const data = await res.json();
        if (data.length > 0) {
            console.log(`✅ SUCCESS di getPostBySlug: Data untuk '${postSlug}' ditemukan.`);
        } else {
            console.warn(`⚠️ WARN di getPostBySlug: Respon OK, tapi tidak ada data untuk slug '${postSlug}'.`);
        }
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error("❌ CRITICAL ERROR di getPostBySlug:", error);
        return null;
    }
}

export async function getAllSlugsForCpt(cptSlug: string): Promise<{ slug: string }[]> {
    console.log(`\n3. Memulai getAllSlugsForCpt untuk CPT '${cptSlug}'...`);
    const token = await getWordPressToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const statusQuery = token ? "&status=publish,pending" : "";
    const fetchUrl = `${process.env.WORDPRESS_API_URL}/wp/v2/${cptSlug}?per_page=100&_fields=slug${statusQuery}`;

    console.log(`   - Melakukan fetch ke URL: ${fetchUrl}`);
    try {
        const res = await fetch(fetchUrl, { headers });
        if (!res.ok) {
            console.error(`❌ ERROR di getAllSlugsForCpt: Gagal mengambil slugs. Status: ${res.status}`);
            return [];
        }
        const slugs = await res.json();
        console.log(`✅ SUCCESS di getAllSlugsForCpt: Ditemukan ${slugs.length} slug.`);
        console.log("   - Daftar Slug:", slugs.map((s: any) => s.slug).join(", ") || "Kosong");
        return slugs;
    } catch (error) {
        console.error("❌ CRITICAL ERROR di getAllSlugsForCpt:", error);
        return [];
    }
}
