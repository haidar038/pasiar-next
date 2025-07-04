import BudayaItemCard from "@/app/components/BudayaItemCard";

interface CagarBudayaItem {
    id: number;
    title: { rendered: string };
    slug: string;
    type: string;
    acf: { lokasi?: string };
}

async function getAllCagarBudaya(): Promise<CagarBudayaItem[]> {
    try {
        const res = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/cagar_budaya?per_page=100`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) throw new Error("Gagal mengambil data dari WordPress.");
        return await res.json();
    } catch (error) {
        console.error("Error fetching Cagar Budaya:", error);
        return [];
    }
}

export default async function CagarBudayaPage() {
    const daftarCagarBudaya = await getAllCagarBudaya();

    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Daftar Cagar Budaya Ternate</h1>

            {daftarCagarBudaya.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {daftarCagarBudaya.map((item) => (
                        <BudayaItemCard key={item.id} item={item} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-600">Saat ini belum ada data Cagar Budaya yang bisa ditampilkan.</p>
            )}
        </div>
    );
}
