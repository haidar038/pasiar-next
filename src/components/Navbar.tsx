"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
    const { user, logout, isAuthenticated, isLoading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const router = useRouter();

    // Handle hydration
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const handleLogout = async () => {
        try {
            logout();
            setIsMobileMenuOpen(false);
            // Small delay to ensure logout completes
            setTimeout(() => {
                router.push("/");
            }, 100);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Show loading state during SSR/hydration and auth loading
    if (!isHydrated || isLoading) {
        return (
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <h1 className="text-xl font-bold text-gray-800">Pasiar</h1>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo and primary navigation */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Link href="/" className="text-xl font-bold text-gray-800 hover:text-blue-600">
                                Pasiar
                            </Link>
                        </div>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:ml-6 md:flex md:space-x-8">
                            <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                                Home
                            </Link>
                            {isAuthenticated && user && (
                                <>
                                    <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                                        Dashboard
                                    </Link>
                                    <Link href="/posts" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                                        Posts
                                    </Link>
                                    <Link href="/profile" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                                        Profile
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Desktop Auth Section */}
                    <div className="hidden md:flex md:items-center md:space-x-4">
                        {isAuthenticated && user ? (
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.displayName || user.username} className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">{user.displayName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || "U"}</span>
                                        </div>
                                    )}
                                    <span className="text-gray-700 text-sm max-w-32 truncate">Hello, {user.displayName || user.username}!</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link href="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 p-2"
                            aria-label="Toggle mobile menu"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
                            <Link href="/" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                Home
                            </Link>

                            {isAuthenticated && user ? (
                                <>
                                    <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                        Dashboard
                                    </Link>
                                    <Link href="/posts" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                        Posts
                                    </Link>
                                    <Link href="/profile" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                        Profile
                                    </Link>
                                    <div className="px-3 py-2 border-t border-gray-200 mt-2">
                                        <div className="flex items-center space-x-3 mb-3">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.displayName || user.username} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-sm font-medium">
                                                        {user.displayName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || "U"}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-gray-900 text-sm font-medium">{user.displayName || user.username}</p>
                                                {user.email && <p className="text-gray-500 text-xs truncate">{user.email}</p>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="px-3 py-2 border-t border-gray-200 space-y-2 mt-2">
                                    <Link
                                        href="/login"
                                        className="w-full text-center block bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="w-full text-center block bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
