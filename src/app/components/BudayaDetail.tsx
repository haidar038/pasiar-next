import React from "react";

// Tipe data yang lebih fleksibel untuk semua jenis postingan
interface PostDetail {
    title: { rendered: string };
    content: { rendered: string };
    type: string;
    acf: {
        [key: string]: any; // Memungkinkan semua jenis field dari ACF
    };
}

// Helper untuk mengubah snake_case menjadi Title Case (e.g., nilai_sejarah -> Nilai Sejarah)
const formatLabel = (key: string) => {
    return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function BudayaDetail({ post }: { post: PostDetail }) {
    // Daftar field ACF yang tidak ingin kita tampilkan secara otomatis
    const excludedFields = ["supabase_user_id"];

    return (
        <article className="container mx-auto py-12 px-4 max-w-4xl">
            {/* Judul Utama */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 leading-tight" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />

            {/* Konten Utama dari Editor WordPress */}
            {post.content.rendered && <div className="prose lg:prose-xl max-w-none border-t pt-8 mt-8" dangerouslySetInnerHTML={{ __html: post.content.rendered }} />}

            {/* Detail Tambahan dari ACF */}
            <div className="mt-12 border-t pt-8">
                <h2 className="text-2xl font-bold mb-6">Detail Informasi</h2>
                <div className="space-y-5">
                    {Object.entries(post.acf).map(([key, value]) => {
                        // Tampilkan field hanya jika memiliki nilai dan tidak termasuk dalam daftar pengecualian
                        if (value && !excludedFields.includes(key)) {
                            return (
                                <div key={key}>
                                    <h3 className="font-semibold text-gray-800 text-lg">{formatLabel(key)}</h3>
                                    {/* Cek jika value adalah URL untuk ditampilkan sebagai link */}
                                    {typeof value === "string" && (value.startsWith("http") || value.startsWith("www")) ? (
                                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                            {value}
                                        </a>
                                    ) : (
                                        <p className="text-gray-600 whitespace-pre-wrap">{value}</p>
                                    )}
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>
        </article>
    );
}
