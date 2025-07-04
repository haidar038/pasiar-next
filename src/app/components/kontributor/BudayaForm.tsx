"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ErrorDisplay, { SuccessDisplay, LoadingDisplay } from "./ErrorDisplay";

interface BudayaFormProps {
    formType: "create" | "edit";
    cptSlug: string;
    postId?: number;
    pageTitle: string;
}

export default function BudayaForm({ formType, cptSlug, postId, pageTitle }: BudayaFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(formType === "edit");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchPostData = useCallback(async () => {
        if (formType !== "edit" || !postId) {
            setIsLoading(false);
            return;
        }

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                router.push("/auth/login");
                return;
            }

            // Panggil API route baru untuk mengambil data satu post dengan aman
            const response = await fetch(`/api/posts/get-one?slug=${cptSlug}&id=${postId}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Gagal mengambil data untuk diedit.");
            }

            const data = await response.json();
            // Mengisi form dengan data yang ada
            setFormData({
                title: data.title.rendered,
                ...data.acf,
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [formType, postId, cptSlug, router]);

    useEffect(() => {
        fetchPostData();
    }, [fetchPostData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            // Get session with better error handling
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                throw new Error(`Authentication error: ${sessionError.message}`);
            }

            if (!session) {
                setError("Sesi Anda telah berakhir. Silakan login kembali.");
                setTimeout(() => router.push("/auth/login"), 1500);
                return;
            }

            // Validate form data before submission
            const requiredFields = ["title"];
            const missingFields = requiredFields.filter((field) => !formData[field] || (typeof formData[field] === "string" && formData[field].trim() === ""));

            if (missingFields.length > 0) {
                setError(`Harap lengkapi field berikut: ${missingFields.join(", ")}`);
                return;
            }

            // Prepare payload
            const payload = {
                ...formData,
                userId: session.user.id,
                cptSlug,
                ...(formType === "edit" && { postId }),
            };

            const apiUrl = formType === "create" ? "/api/posts/create" : "/api/posts/update";

            // Submit with retry logic
            let lastError;
            let attempt = 0;
            const maxRetries = 3;

            while (attempt < maxRetries) {
                try {
                    const response = await fetch(apiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify(payload),
                    });

                    const result = await response.json();

                    // Handle different response statuses
                    if (response.status === 429) {
                        throw new Error("Terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi.");
                    }

                    if (response.status === 401) {
                        setError("Sesi Anda telah berakhir. Silakan login kembali.");
                        setTimeout(() => router.push("/auth/login"), 1500);
                        return;
                    }

                    if (response.status === 403) {
                        throw new Error("Anda tidak memiliki izin untuk melakukan aksi ini.");
                    }

                    if (!response.ok) {
                        // Handle validation errors
                        if (result.errors && Array.isArray(result.errors)) {
                            throw new Error(`Validasi gagal: ${result.errors.join(", ")}`);
                        }
                        throw new Error(result.message || `Terjadi kesalahan (${response.status})`);
                    }

                    // Success
                    const actionText = formType === "create" ? "dibuat" : "diperbarui";
                    setSuccess(`Sukses! Data telah berhasil ${actionText}.`);

                    // Redirect after success
                    setTimeout(() => router.push("/kontributor/dashboard"), 2000);
                    return;
                } catch (fetchError: any) {
                    lastError = fetchError;
                    attempt++;

                    // If it's a retryable error and we have retries left
                    if (attempt < maxRetries && (fetchError.name === "TypeError" || fetchError.message.includes("fetch") || fetchError.message.includes("network"))) {
                        // Wait before retry (exponential backoff)
                        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                        continue;
                    }

                    // Non-retryable error or out of retries
                    throw lastError;
                }
            }
        } catch (err: any) {
            console.error(`Form submission error (${formType}):`, err);

            // User-friendly error messages
            let userMessage = err.message;

            if (err.name === "TypeError" && err.message.includes("fetch")) {
                userMessage = "Koneksi bermasalah. Silakan periksa internet Anda dan coba lagi.";
            } else if (err.message.includes("JSON")) {
                userMessage = "Terjadi kesalahan format data. Silakan coba lagi.";
            } else if (err.message.includes("timeout")) {
                userMessage = "Permintaan memakan waktu terlalu lama. Silakan coba lagi.";
            }

            setError(userMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <LoadingDisplay message="Memuat form..." size="lg" />;

    // Contoh render field kondisional untuk Cagar Budaya
    const renderCagarBudayaFields = () => (
        <>
            <div className="mb-4">
                <label className="block text-gray-700">Lokasi</label>
                <input type="text" name="lokasi" value={formData.lokasi || ""} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
            </div>
            {/* Tambahkan field lain di sini */}
        </>
    );

    return (
        <main className="container mx-auto p-4 md:p-8">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">{pageTitle}</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-semibold">
                            Judul <span className="text-red-500">*</span>
                        </label>
                        <input type="text" name="title" value={formData.title || ""} onChange={handleChange} className="w-full p-2 border rounded mt-1" required />
                    </div>

                    {cptSlug === "cagar_budaya" && renderCagarBudayaFields()}
                    {/* Tambahkan render function untuk CPT lain di sini */}

                    <ErrorDisplay
                        error={error}
                        onDismiss={() => setError(null)}
                        onRetry={() => {
                            setError(null);
                            // Re-trigger form submission if there was a retryable error
                        }}
                        retryable={error?.includes("koneksi") || error?.includes("network") || error?.includes("timeout")}
                    />

                    <SuccessDisplay message={success} onDismiss={() => setSuccess(null)} />

                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Memproses...
                                </>
                            ) : formType === "create" ? (
                                "Kirim untuk Ditinjau"
                            ) : (
                                "Simpan Perubahan"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
