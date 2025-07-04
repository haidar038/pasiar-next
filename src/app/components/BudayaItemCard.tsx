import Link from "next/link";

interface BudayaItem {
    id: number;
    title: {
        rendered: string;
    };
    slug: string;
    type: string;
    acf: {
        lokasi?: string;
    };
}

const formatPostType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function BudayaItemCard({ item }: { item: BudayaItem }) {
    return (
        <Link href={`/${item.type}/${item.slug}`} className="block group">
            <div className="border rounded-lg p-5 shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white h-full">
                <p className="text-sm font-semibold text-blue-600 mb-1">{formatPostType(item.type)}</p>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{item.title.rendered}</h3>
                {item.acf.lokasi && <p className="text-gray-500 mt-2">Lokasi: {item.acf.lokasi}</p>}
            </div>
        </Link>
    );
}
