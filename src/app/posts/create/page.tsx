"use client";

import { PostsProvider } from "@/contexts/PostsContext";
import PostForm from "@/components/PostForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

export default function CreatePostPage() {
    return (
        <ProtectedRoute>
            <PostsProvider>
                <div className="min-h-screen bg-gray-100">
                    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
                                    <p className="mt-2 text-gray-600">Share your thoughts and ideas with the community.</p>
                                </div>
                                <Link
                                    href="/posts"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <svg className="mr-2 -ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to Posts
                                </Link>
                            </div>
                        </div>

                        {/* Post Form */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">Post Details</h2>
                                <p className="mt-1 text-sm text-gray-500">Fill in the information below to create your post.</p>
                            </div>
                            <div className="px-6 py-4">
                                <PostForm />
                            </div>
                        </div>

                        {/* Tips Section */}
                        <div className="mt-8 bg-blue-50 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-blue-900 mb-4">Writing Tips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                                <div>
                                    <h4 className="font-medium mb-2">Title Guidelines:</h4>
                                    <ul className="space-y-1 list-disc list-inside">
                                        <li>Keep it concise and descriptive</li>
                                        <li>Use relevant keywords</li>
                                        <li>Make it engaging</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">Content Best Practices:</h4>
                                    <ul className="space-y-1 list-disc list-inside">
                                        <li>Use clear and simple language</li>
                                        <li>Break up long paragraphs</li>
                                        <li>Add examples when helpful</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PostsProvider>
        </ProtectedRoute>
    );
}
