"use client";

import { useParams } from "next/navigation";
import BudayaForm from "@/app/components/kontributor/BudayaForm";

export default function EditDataPage() {
    const params = useParams();
    const cptSlug = Array.isArray(params.cpt_slug) ? params.cpt_slug[0] : params.cpt_slug;
    const postId = Array.isArray(params.post_id) ? params.post_id[0] : params.post_id;

    if (!cptSlug || !postId) {
        return <div>Loading atau parameter tidak valid...</div>;
    }

    const pageTitle = `Edit Data ${cptSlug.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}`;

    return <BudayaForm formType="edit" cptSlug={cptSlug} postId={Number(postId)} pageTitle={pageTitle} />;
}
