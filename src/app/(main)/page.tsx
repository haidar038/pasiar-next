// File: app/page.tsx
// Ini adalah Server Component, tempat kita mengambil data dari WordPress.

// Komponen untuk menampilkan data (dibuat terpisah agar rapi)
import CagarBudayaCard from '@/app/components/CagarBudayaCard';
// Komponen untuk form login (ini akan menjadi Client Component)
import RegistrationForm from '../components/RegistrationForm';
import LoginForm from '@/app/components/LoginForm';

// Tipe data untuk Cagar Budaya agar kode lebih aman
interface CagarBudaya {
    id: number;
    title: {
        rendered: string;
    };
    slug: string;
    acf: {
        lokasi: string;
        // tambahkan field acf lain jika perlu
    };
}

// Fungsi untuk mengambil data dari WordPress API
async function getCagarBudaya() {
    try {
        // Kita gunakan fetch langsung di sini karena ini adalah Server Component
        const res = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/cagar_budaya`, {
            // Opsi revalidate untuk memastikan data tidak terlalu usang
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            throw new Error('Gagal mengambil data cagar budaya');
        }

        const data: CagarBudaya[] = await res.json();
        return data;
    } catch (error) {
        console.error(error);
        return []; // Kembalikan array kosong jika terjadi error
    }
}

// Komponen Halaman Utama
export default async function HomePage() {
    // Panggil fungsi untuk mengambil data
    const daftarCagarBudaya = await getCagarBudaya();

    return (
        <main className="p-8">
            <section className="mb-12">
                <h1 className="text-4xl font-bold mb-4">Uji Coba Autentikasi Kontributor</h1>
                <div className="flex flex-wrap gap-8">
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Login</h2>
                        <LoginForm />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Registrasi</h2>
                        <RegistrationForm />
                    </div>
                </div>
            </section>

            <hr className="my-8" />

            <section>
                <h1 className="text-4xl font-bold mb-4">Uji Coba Data dari WordPress</h1>
                <p className="mb-4">Data di bawah ini ditarik langsung dari API WordPress Anda.</p>

                {daftarCagarBudaya.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {daftarCagarBudaya.map((item) => (
                            // Render komponen Card untuk setiap item
                            <CagarBudayaCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <p>Tidak ada data cagar budaya yang bisa ditampilkan atau terjadi error saat mengambil data.</p>
                )}
            </section>
        </main>
    );
}
