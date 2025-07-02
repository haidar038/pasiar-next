// Ambil semua slug untuk dijadikan path
export async function getStaticPaths() {
    const res = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/cagar_budaya`);
    const posts = await res.json();
    interface CagarBudayaPost {
        slug: string;
        [key: string]: any;
    }

    interface Path {
        params: {
            slug: string;
        };
    }

    const paths: Path[] = (posts as CagarBudayaPost[]).map((post: CagarBudayaPost) => ({
        params: { slug: post.slug },
    }));
    return { paths, fallback: 'blocking' };
}

// Ambil data spesifik berdasarkan slug
export async function getStaticProps({ params }: { params: { slug: string } }) {
    const res = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/cagar_budaya?slug=${params.slug}`);
    const post = await res.json();
    return {
        props: { post: post[0] },
        revalidate: 10,
    };
}
