"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-100">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="bg-white shadow rounded-lg p-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

                            {/* Welcome Section */}
                            <div className="mb-8">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-blue-900">Welcome back!</h3>
                                    <p className="text-blue-700">Hello, {user?.displayName || user?.username}! What would you like to do today?</p>
                                </div>
                            </div>

                            {/* Quick Actions Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-green-900 mb-2">Profile Status</h3>
                                    <p className="text-green-700 mb-3">Account is active</p>
                                    <Link href="/profile" className="inline-block bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                                        View Profile
                                    </Link>
                                </div>

                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-purple-900 mb-2">Posts Management</h3>
                                    <p className="text-purple-700 mb-3">Create and manage your posts</p>
                                    <Link href="/posts" className="inline-block bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors">
                                        Manage Posts
                                    </Link>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">Quick Actions</h3>
                                    <p className="text-yellow-700 mb-3">Frequently used features</p>
                                    <div className="space-y-2">
                                        <Link href="/posts/create" className="block bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700 transition-colors text-center">
                                            Create New Post
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity Section */}
                            <div className="border-t pt-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Navigation</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Link href="/posts" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                        <div className="flex-shrink-0">
                                            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-blue-900">All Posts</p>
                                            <p className="text-sm text-blue-700">View all your posts</p>
                                        </div>
                                    </Link>

                                    <Link href="/posts/create" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                        <div className="flex-shrink-0">
                                            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-green-900">Create Post</p>
                                            <p className="text-sm text-green-700">Write a new post</p>
                                        </div>
                                    </Link>

                                    <Link href="/profile" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex-shrink-0">
                                            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">Profile</p>
                                            <p className="text-sm text-gray-700">Manage your account</p>
                                        </div>
                                    </Link>

                                    <div className="flex items-center p-4 bg-orange-50 rounded-lg">
                                        <div className="flex-shrink-0">
                                            <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-orange-900">Analytics</p>
                                            <p className="text-sm text-orange-700">Coming soon</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
