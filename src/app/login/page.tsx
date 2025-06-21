"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/LoginForm";
import Link from "next/link";

export default function LoginPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        // Only redirect if we're sure the user is authenticated and not already redirecting
        if (isAuthenticated && !isLoading && !isRedirecting) {
            console.log("[LoginPage] User is authenticated, redirecting to dashboard");
            setIsRedirecting(true);
            router.replace("/dashboard");
        }
    }, [isAuthenticated, isLoading, router, isRedirecting]);

    // Show loading state while determining auth status
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <h2 className="mt-4 text-xl font-medium text-gray-900">Loading...</h2>
                        <p className="mt-2 text-sm text-gray-600">Please wait while we check your authentication status</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show redirecting state
    if (isAuthenticated || isRedirecting) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <h2 className="mt-4 text-xl font-medium text-gray-900">Redirecting...</h2>
                        <p className="mt-2 text-sm text-gray-600">Taking you to your dashboard</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="text-3xl font-bold text-blue-600 hover:text-blue-700">
                        Pasiar
                    </Link>
                </div>

                <LoginForm />

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-50 text-gray-500">New to Pasiar?</span>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <Link
                            href="/register"
                            className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Create new account
                        </Link>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
