"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");
        try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            setMessage("Registrasi berhasil! Silakan cek email Anda untuk verifikasi (jika diaktifkan) dan login.");
        } catch (error: any) {
            setMessage(`Registrasi gagal: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-gray-900">Daftar Akun Kontributor</h1>
                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 mt-1 border rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 mt-1 border rounded-md" placeholder="Minimal 6 karakter" required />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400">
                        {isLoading ? "Memproses..." : "Buat Akun"}
                    </button>
                    {message && <p className={`text-sm text-center ${message.includes("gagal") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
                </form>
                <p className="text-sm text-center text-gray-600">
                    Sudah punya akun?{" "}
                    <Link href="/auth/login" className="font-medium text-blue-600 hover:underline">
                        Login di sini
                    </Link>
                </p>
            </div>
        </div>
    );
}
