"use client";

import { useParams } from "next/navigation";
import BudayaForm from "@/app/components/kontributor/BudayaForm";

export default function AddDataPage() {
    const params = useParams();
    const cptSlug = Array.isArray(params.cpt_slug) ? params.cpt_slug[0] : params.cpt_slug;

    if (!cptSlug) {
        return <div>Loading atau tipe konten tidak valid...</div>;
    }

    const pageTitle = `Tambah Data ${cptSlug.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Baru`;

    return <BudayaForm formType="create" cptSlug={cptSlug} pageTitle={pageTitle} />;
}
