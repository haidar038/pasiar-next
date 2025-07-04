"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const categories = [
    { name: "Cagar Budaya", slug: "cagar_budaya", description: "Bangunan, situs, benda, atau struktur bersejarah." },
    { name: "Kesenian", slug: "kesenian", description: "Seni rupa, pertunjukan, musik, atau sastra khas Ternate." },
    { name: "Tokoh", slug: "tokoh", description: "Budayawan, sejarawan, seniman, atau pelestari budaya." },
    { name: "Komunitas", slug: "komunitas", description: "Sanggar, kelompok seni, atau organisasi kebudayaan." },
    { name: "Tradisi Lokal", slug: "tradisi_lokal", description: "Ritual, upacara adat, atau kebiasaan turun-temurun." },
];

export default function SelectCategoryPage() {
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                router.push("/auth/login");
            }
        };
        checkUser();
    }, [router]);

    return (
        <main className="container mx-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-2 text-gray-800">Tambah Kontribusi Baru</h1>
                <p className="text-gray-600 mb-8">Pilih jenis data budaya yang ingin Anda tambahkan.</p>

                <div className="space-y-4">
                    {categories.map((category) => (
                        <Link key={category.slug} href={`/kontributor/tambah/${category.slug}`} className="block">
                            <div className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md hover:border-blue-500 transition-all">
                                <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                                <p className="text-gray-500 mt-1">{category.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
