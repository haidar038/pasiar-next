"use client";

import { PostsProvider } from "@/contexts/PostsContext";
import PostManagement from "@/components/PostManagement";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function PostsPage() {
    return (
        <ProtectedRoute>
            <PostsProvider>
                <div className="min-h-screen bg-gray-100">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-gray-900">Posts Management</h1>
                            <p className="mt-2 text-gray-600">Create, edit, and manage all your posts in one place.</p>
                        </div>
                        <PostManagement />
                    </div>
                </div>
            </PostsProvider>
        </ProtectedRoute>
    );
}
