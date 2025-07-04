/*
================================================================================
File 2: Halaman Dashboard Kontributor (Frontend)
Lokasi: src/app/kontributor/dashboard/page.tsx
Deskripsi: Halaman ini telah didesain ulang untuk menampilkan daftar kontribusi
dengan tampilan yang lebih baik, termasuk status dan jenis postingan.
Ganti seluruh isi file lama Anda dengan kode ini.
================================================================================
*/

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import DeleteConfirmationModal from "@/app/components/kontributor/DeleteConfirmationModal";

// Tipe data untuk setiap postingan
interface MyPost {
    id: number;
    title: {
        rendered: string;
    };
    status: "publish" | "pending" | "draft";
    type: string; // Slug CPT, e.g., 'cagar_budaya'
}

// Fungsi untuk mengubah slug menjadi label yang mudah dibaca
const formatPostType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// Fungsi untuk memberi warna pada status
const getStatusChip = (status: string) => {
    switch (status) {
        case "publish":
            return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Diterbitkan</span>;
        case "pending":
            return <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Menunggu Tinjauan</span>;
        case "draft":
            return <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">Draft</span>;
        default:
            return <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
};

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [myPosts, setMyPosts] = useState<MyPost[]>([]);
    const [postToDelete, setPostToDelete] = useState<MyPost | null>(null);
    const router = useRouter();

    const fetchMyPosts = async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (session) {
            const response = await fetch("/api/kontributor/my-posts", {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setMyPosts(data);
            }
        }
    };

    useEffect(() => {
        const checkSessionAndFetchPosts = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                router.push("/auth/login");
                return;
            }

            setUser(session.user);

            try {
                const response = await fetch("/api/kontributor/my-posts", {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });

                if (!response.ok) {
                    throw new Error("Gagal mengambil data kontribusi Anda.");
                }

                const data = await response.json();
                setMyPosts(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSessionAndFetchPosts();
    }, [router]);

    const handleDelete = async () => {
        if (!postToDelete) return;

        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const response = await fetch("/api/posts/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
                body: JSON.stringify({ postId: postToDelete.id, cptSlug: postToDelete.type }),
            });
            if (!response.ok) throw new Error("Gagal menghapus postingan.");

            // Refresh daftar postingan setelah berhasil dihapus
            await fetchMyPosts();
            setPostToDelete(null); // Tutup modal
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat menghapus postingan.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Memuat data dashboard...</p>
            </div>
        );
    }

    return (
        <>
            <main className="container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Dashboard Kontributor</h1>
                        <p className="mt-1 text-gray-600">Selamat datang kembali, {user?.email}!</p>
                    </div>
                    <Link href="/kontributor/tambah-data" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-sm">
                        + Tambah Data Baru
                    </Link>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Daftar Kontribusi Anda</h2>
                    {myPosts.length > 0 ? (
                        <div className="space-y-4">
                            {myPosts.map((post) => (
                                <div key={post.id} className="border p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-500">{formatPostType(post.type)}</p>
                                        <h3 className="text-lg font-medium text-gray-900">{post.title.rendered}</h3>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        {getStatusChip(post.status)}
                                        <Link href={`/kontributor/edit/${post.type}/${post.id}`} className="text-sm text-blue-600 hover:underline">
                                            Edit
                                        </Link>
                                        <button onClick={() => setPostToDelete(post)} className="text-sm text-red-600 hover:underline">
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">Anda belum memiliki kontribusi.</p>
                    )}
                </div>
            </main>
            {postToDelete && <DeleteConfirmationModal postTitle={postToDelete.title.rendered} onConfirm={handleDelete} onCancel={() => setPostToDelete(null)} />}
        </>
    );
}
