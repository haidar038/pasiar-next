import { NextResponse } from "next/server";
import { getWordPressToken } from "@/lib/wordpress";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cptSlug = searchParams.get("slug");
        const postId = searchParams.get("id");

        const token = request.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ message: "Otentikasi pengguna gagal." }, { status: 401 });

        const {
            data: { user },
        } = await supabase.auth.getUser(token);
        if (!user) return NextResponse.json({ message: "Pengguna tidak valid." }, { status: 401 });

        if (!cptSlug || !postId) return NextResponse.json({ message: "Informasi tidak lengkap." }, { status: 400 });

        const wpToken = await getWordPressToken();
        if (!wpToken) throw new Error("Otentikasi server gagal.");

        const response = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/${cptSlug}/${postId}?context=edit`, {
            headers: { Authorization: `Bearer ${wpToken}` },
        });

        const postData = await response.json();
        if (!response.ok) throw new Error(postData.message || "Gagal mengambil data postingan.");

        // Keamanan: Pastikan pengguna yang meminta adalah pemilik postingan
        if (postData.acf?.supabase_user_id !== user.id) {
            return NextResponse.json({ message: "Anda tidak berhak mengakses data ini." }, { status: 403 });
        }

        return NextResponse.json(postData, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
