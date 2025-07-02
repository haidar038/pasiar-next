export async function getStaticProps() {
    const res = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/cagar_budaya`);
    const cagarBudaya = await res.json();

    return {
        props: {
            cagarBudaya,
        },
        revalidate: 10, // Opsional: Coba refresh data setiap 10 detik
    };
}
