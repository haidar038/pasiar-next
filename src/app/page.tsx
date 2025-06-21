"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function HomePage() {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Pasiar</h1>
                    <p className="text-xl text-gray-600 mb-8">Your secure platform for authentication and content management</p>

                    {isAuthenticated ? (
                        <div className="space-y-8">
                            {/* Welcome Back Section */}
                            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome back, {user?.displayName || user?.username}!</h2>
                                <p className="text-gray-600 mb-6">Ready to manage your content and explore your dashboard?</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Link href="/dashboard" className="bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors text-center">
                                        Dashboard
                                    </Link>
                                    <Link href="/posts" className="bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors text-center">
                                        Manage Posts
                                    </Link>
                                    <Link href="/profile" className="bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors text-center">
                                        Profile
                                    </Link>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Link
                                        href="/posts/create"
                                        className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                                    >
                                        <svg className="h-8 w-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-gray-900">Create New Post</p>
                                            <p className="text-sm text-gray-600">Share your thoughts</p>
                                        </div>
                                    </Link>

                                    <Link href="/posts" className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                        <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                            />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-gray-900">View All Posts</p>
                                            <p className="text-sm text-gray-600">Manage your content</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Get Started Section */}
                            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Get Started</h2>
                                <p className="text-gray-600 mb-6">Join our platform to start creating and managing your content.</p>
                                <div className="space-y-4">
                                    <Link href="/login" className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors text-center">
                                        Login
                                    </Link>
                                    <Link href="/register" className="block w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors text-center">
                                        Register
                                    </Link>
                                </div>
                            </div>

                            {/* Features Preview */}
                            <div className="max-w-4xl mx-auto">
                                <h3 className="text-2xl font-semibold text-gray-800 text-center mb-8">What You Can Do</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="text-center">
                                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Secure Authentication</h4>
                                        <p className="text-gray-600">Safe and secure user authentication with WordPress integration.</p>
                                    </div>

                                    <div className="text-center">
                                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Content Management</h4>
                                        <p className="text-gray-600">Create, edit, and manage your posts with full CRUD functionality.</p>
                                    </div>

                                    <div className="text-center">
                                        <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                                />
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Dashboard & Analytics</h4>
                                        <p className="text-gray-600">Comprehensive dashboard to monitor and manage your activities.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
