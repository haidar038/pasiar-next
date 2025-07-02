'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import React from 'react';

export default function TambahData() {
    const [formData, setFormData] = useState({
        title: '',
        lokasi: '',
        nilaiSejarah: '',
        nilaiBudaya: '',
        sumberInformasi: '',
        jenisBangunan: '',
        usiaBangunan: '',
        kondisiBangunan: '',
        nilaiArsitektur: '',
        jenisSitus: '',
        luasSitus: '',
        kondisiSitus: '',
        jenisKawasan: '',
        luasKawasan: '',
        kondisiKawasan: '',
        jenisBenda: '',
        deskripsiBenda: '',
        tahunPenemuan: '',
        kondisiBenda: '',
        jenisStruktur: '',
        deskripsiStruktur: '',
        tahunDibangun: '',
        kondisiStruktur: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            // Get user session
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                alert('Session not found, please login again.');
                router.push('/auth/login');
                return;
            }

            const userId = session.user.id;

            // Prepare payload
            const payload = {
                ...formData,
                userId,
            };

            console.log('Sending payload:', payload);

            const response = await fetch('/api/submit-cagar-budaya', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json();
            console.log('Response:', responseData);

            if (response.ok) {
                alert('Success! Your data has been sent for admin review.');
                // Reset form
                setFormData({
                    title: '',
                    lokasi: '',
                    nilaiSejarah: '',
                    nilaiBudaya: '',
                    sumberInformasi: '',
                    jenisBangunan: '',
                    usiaBangunan: '',
                    kondisiBangunan: '',
                    nilaiArsitektur: '',
                    jenisSitus: '',
                    luasSitus: '',
                    kondisiSitus: '',
                    jenisKawasan: '',
                    luasKawasan: '',
                    kondisiKawasan: '',
                    jenisBenda: '',
                    deskripsiBenda: '',
                    tahunPenemuan: '',
                    kondisiBenda: '',
                    jenisStruktur: '',
                    deskripsiStruktur: '',
                    tahunDibangun: '',
                    kondisiStruktur: '',
                });
                // Optionally redirect to dashboard
                // router.push('/kontributor/dashboard');
            } else {
                alert(`Failed to send data: ${responseData.message}`);
                console.error('Error details:', responseData);
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('An error occurred while sending data. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Tambah Data Cagar Budaya Baru</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Cagar Budaya *</label>
                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi *</label>
                        <input type="text" name="lokasi" value={formData.lokasi} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                {/* Historical and Cultural Values */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nilai Sejarah</label>
                        <textarea name="nilaiSejarah" value={formData.nilaiSejarah} onChange={handleInputChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nilai Budaya</label>
                        <textarea name="nilaiBudaya" value={formData.nilaiBudaya} onChange={handleInputChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                {/* Source Information */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sumber Informasi</label>
                    <textarea
                        name="sumberInformasi"
                        value={formData.sumberInformasi}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Building Information */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Informasi Bangunan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Bangunan</label>
                            <input
                                type="text"
                                name="jenisBangunan"
                                value={formData.jenisBangunan}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Usia Bangunan</label>
                            <input
                                type="text"
                                name="usiaBangunan"
                                value={formData.usiaBangunan}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kondisi Bangunan</label>
                            <input
                                type="text"
                                name="kondisiBangunan"
                                value={formData.kondisiBangunan}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nilai Arsitektur</label>
                            <input
                                type="text"
                                name="nilaiArsitektur"
                                value={formData.nilaiArsitektur}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Add more sections for other field categories */}
                {/* You can add similar sections for Site, Area, Object, and Structure information */}

                <div className="flex justify-end space-x-4 pt-6">
                    <button type="button" onClick={() => router.back()} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50" disabled={isSubmitting}>
                        Batal
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Mengirim...' : 'Kirim untuk Ditinjau'}
                    </button>
                </div>
            </form>
        </div>
    );
}
