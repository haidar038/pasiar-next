"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginForm() {
    const { login, isAuthenticated } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !isRedirecting) {
            setIsRedirecting(true);
            router.push("/dashboard");
        }
    }, [isAuthenticated, router, isRedirecting]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (error) {
            setError("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent multiple submissions
        if (isLoading || isRedirecting) return;

        // Basic validation
        if (!formData.username.trim() || !formData.password.trim()) {
            setError("Please fill in all fields");
            return;
        }

        setError("");
        setIsLoading(true);

        try {
            console.log("[LoginForm] Submitting login...");
            await login({
                username: formData.username.trim(),
                password: formData.password,
            });

            console.log("[LoginForm] Login successful, redirecting...");
            setIsRedirecting(true);

            // Small delay to ensure auth context is updated
            setTimeout(() => {
                router.push("/dashboard");
            }, 100);
        } catch (err: any) {
            console.error("[LoginForm] Login error:", err);
            setError(err.message || "Login failed. Please try again.");
            setIsLoading(false);
        }
    };

    // Show redirecting state
    if (isRedirecting) {
        return (
            <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6 p-6 bg-white rounded-lg shadow-md">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Login to Your Account</h2>
                <p className="mt-2 text-sm text-gray-600">Please sign in to continue</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Username or Email
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter your username or email"
                        required
                        autoComplete="username"
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading || isRedirecting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                    </>
                ) : (
                    "Sign In"
                )}
            </button>

            <div className="text-center">
                <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                    Forgot your password?
                </a>
            </div>
        </form>
    );
}
