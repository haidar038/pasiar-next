// File: app/components/CagarBudayaCard.tsx
// Komponen sederhana untuk menampilkan data

// Define or import the CagarBudaya type
type CagarBudaya = {
    title: { rendered: string };
    acf: { lokasi?: string };
};

export default function CagarBudayaCard({ item }: { item: CagarBudaya }) {
    return (
        <div className="border rounded-lg p-4 shadow-md">
            <h3 className="text-xl font-bold">{item.title.rendered}</h3>
            <p className="text-gray-600">Lokasi: {item.acf.lokasi || 'Tidak ada data'}</p>
        </div>
    );
}
