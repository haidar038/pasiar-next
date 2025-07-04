"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        const getInitialSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        };
        getInitialSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-gray-800">
                            Pusdatin Ternate
                        </Link>
                    </div>
                    <div className="hidden md:flex md:space-x-8">
                        <Link href="/cagar_budaya" className="text-gray-600 hover:text-blue-600">
                            Cagar Budaya
                        </Link>
                        <Link href="/kesenian" className="text-gray-600 hover:text-blue-600">
                            Kesenian
                        </Link>
                        <Link href="/tokoh" className="text-gray-600 hover:text-blue-600">
                            Tokoh
                        </Link>
                        {/* Tambahkan link lain di sini */}
                    </div>
                    <div className="flex items-center space-x-3">
                        {user ? (
                            <>
                                <span className="text-gray-700 text-sm hidden sm:block">{user.email}</span>
                                <Link href="/kontributor/dashboard" className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-200">
                                    Dashboard
                                </Link>
                                <button onClick={handleLogout} className="px-3 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/login" className="px-3 py-2 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-100">
                                    Login
                                </Link>
                                <Link href="/auth/register" className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}
