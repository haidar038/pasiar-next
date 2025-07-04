"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // Redirect ke dashboard setelah login berhasil
            router.push("/kontributor/dashboard");
        } catch (error: any) {
            setMessage(`Login gagal: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-gray-900">Login Kontributor</h1>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 mt-1 border rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 mt-1 border rounded-md" required />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400">
                        {isLoading ? "Memproses..." : "Login"}
                    </button>
                    {message && <p className="text-sm text-center text-red-500">{message}</p>}
                </form>
                <p className="text-sm text-center text-gray-600">
                    Belum punya akun?{" "}
                    <Link href="/auth/register" className="font-medium text-blue-600 hover:underline">
                        Daftar di sini
                    </Link>
                </p>
            </div>
        </div>
    );
}
