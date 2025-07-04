import BudayaItemCard from "@/app/components/BudayaItemCard";

// Definisikan tipe data yang lebih umum
interface BudayaItem {
    id: number;
    title: {
        rendered: string;
    };
    slug: string;
    type: string; // 'cagar_budaya', 'kesenian', etc.
    acf: {
        lokasi?: string;
        // tambahkan field lain yang mungkin ada
    };
}

async function getRecentItems() {
    try {
        // Ambil 3 item terbaru dari Cagar Budaya dan Kesenian
        const [cagarBudayaRes, kesenianRes] = await Promise.all([
            fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/cagar_budaya?per_page=3`, { next: { revalidate: 60 } }),
            fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/kesenian?per_page=3`, { next: { revalidate: 60 } }),
        ]);

        if (!cagarBudayaRes.ok || !kesenianRes.ok) {
            // Tidak melempar error agar halaman tidak rusak jika salah satu gagal
            console.error("Gagal mengambil data terbaru dari salah satu endpoint");
            return [];
        }

        const cagarBudaya: BudayaItem[] = await cagarBudayaRes.json();
        const kesenian: BudayaItem[] = await kesenianRes.json();

        // Gabungkan dan kembalikan
        return [...cagarBudaya, ...kesenian];
    } catch (error) {
        console.error(error);
        return [];
    }
}

export default async function HomePage() {
    const recentItems = await getRecentItems();

    return (
        <>
            {/* Hero Section */}
            <section className="bg-blue-700 text-white">
                <div className="container mx-auto text-center py-20 px-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold">Menjelajahi Kekayaan Budaya Ternate</h1>
                    <p className="mt-4 text-lg md:text-xl text-blue-200 max-w-3xl mx-auto">
                        Sebuah platform digital untuk mendokumentasikan, melestarikan, dan berbagi warisan budaya Moloku Kie Raha.
                    </p>
                </div>
            </section>

            {/* Konten Terbaru */}
            <section className="container mx-auto py-16 px-4">
                <h2 className="text-3xl font-bold text-center mb-10">Sorotan Budaya Terbaru</h2>
                {recentItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {recentItems.map((item) => (
                            <BudayaItemCard key={`${item.type}-${item.id}`} item={item} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-600">Saat ini belum ada konten yang bisa ditampilkan.</p>
                )}
            </section>
        </>
    );
}
