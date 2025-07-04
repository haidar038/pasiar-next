"use client";

import { useParams } from "next/navigation";
import BudayaForm from "@/app/components/kontributor/BudayaForm";

export default function EditDataPage() {
    const params = useParams();
    // Memastikan parameter selalu string, bahkan jika params.key adalah string[]
    const cptSlug = Array.isArray(params.cpt_slug) ? params.cpt_slug[0] : params.cpt_slug;
    const postId = Array.isArray(params.post_id) ? params.post_id[0] : params.post_id;

    // Tampilkan loading state jika parameter belum siap
    if (!cptSlug || !postId) {
        return <div className="text-center p-10">Memuat form editor...</div>;
    }

    // Membuat judul halaman yang dinamis dan rapi
    const pageTitle = `Edit Data ${cptSlug.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}`;

    return (
        <BudayaForm
            formType="edit"
            cptSlug={cptSlug}
            postId={Number(postId)} // Konversi postId ke number
            pageTitle={pageTitle}
        />
    );
}
