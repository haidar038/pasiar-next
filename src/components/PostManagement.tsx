// components/PostManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { usePosts } from "@/contexts/PostsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Post, PostFilters } from "@/types/post";
import PostForm from "./PostForm";

interface PostManagementProps {
    userId?: number;
}

export default function PostManagement({ userId }: PostManagementProps) {
    const { user } = useAuth();
    const { posts, pagination, isLoading, error, fetchUserPosts, deletePost, clearError } = usePosts();

    const [filters, setFilters] = useState<PostFilters>({
        status: "all",
        sortBy: "date",
        sortOrder: "desc",
        page: 1,
        limit: 10,
    });

    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState<Post | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const targetUserId = userId || user?.id;

    useEffect(() => {
        if (targetUserId) {
            fetchUserPosts(targetUserId, filters);
        }
    }, [targetUserId, filters]);

    const handleFilterChange = (newFilters: Partial<PostFilters>) => {
        setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange({ search: searchTerm });
    };

    const handleEditPost = (post: Post) => {
        setSelectedPost(post);
        setShowForm(true);
    };

    const handleDeletePost = async (post: Post) => {
        try {
            await deletePost(post.id);
            setShowDeleteModal(null);
            // Refresh the list
            if (targetUserId) {
                fetchUserPosts(targetUserId, filters);
            }
        } catch (err) {
            console.error("Delete post error:", err);
        }
    };

    const handleFormSuccess = (post: Post) => {
        setShowForm(false);
        setSelectedPost(null);
        // Refresh the list
        if (targetUserId) {
            fetchUserPosts(targetUserId, filters);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            published: "bg-green-100 text-green-800",
            draft: "bg-yellow-100 text-yellow-800",
            private: "bg-gray-100 text-gray-800",
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const handlePageChange = (page: number) => {
        handleFilterChange({ page });
    };

    if (showForm) {
        return (
            <PostForm
                post={selectedPost || undefined}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                    setShowForm(false);
                    setSelectedPost(null);
                }}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">{userId && userId !== user?.id ? "User Posts" : "My Posts"}</h2>
                        <button
                            onClick={() => {
                                setSelectedPost(null);
                                setShowForm(true);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Post
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search posts..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </form>

                        {/* Status Filter */}
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange({ status: e.target.value as any })}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="private">Private</option>
                        </select>

                        {/* Sort Filter */}
                        <select
                            value={`${filters.sortBy}-${filters.sortOrder}`}
                            onChange={(e) => {
                                const [sortBy, sortOrder] = e.target.value.split("-");
                                handleFilterChange({ sortBy: sortBy as any, sortOrder: sortOrder as any });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="date-desc">Newest First</option>
                            <option value="date-asc">Oldest First</option>
                            <option value="title-asc">Title A-Z</option>
                            <option value="title-desc">Title Z-A</option>
                            <option value="likes-desc">Most Liked</option>
                            <option value="comments-desc">Most Comments</option>
                        </select>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                        <div className="flex justify-between items-center">
                            <p className="text-red-800">{error}</p>
                            <button onClick={clearError} className="text-red-600 hover:text-red-800">
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Posts List */}
                <div className="divide-y divide-gray-200">
                    {isLoading ? (
                        <div className="px-6 py-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-500">Loading posts...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No posts</h3>
                            <p className="mt-1 text-sm text-gray-500">{filters.search ? "No posts match your search." : "Get started by creating a new post."}</p>
                            {!filters.search && (
                                <div className="mt-6">
                                    <button
                                        onClick={() => {
                                            setSelectedPost(null);
                                            setShowForm(true);
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        New Post
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        posts.map((post) => (
                            <div key={post.id} className="px-6 py-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">{post.title}</h3>
                                            {getStatusBadge(post.status)}
                                        </div>

                                        {post.excerpt && <p className="mt-1 text-sm text-gray-600 line-clamp-2">{post.excerpt.replace(/<[^>]*>/g, "")}</p>}

                                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                            <span>
                                                <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                {formatDate(post.createdAt)}
                                            </span>

                                            {post.likesCount !== undefined && (
                                                <span>
                                                    <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                        />
                                                    </svg>
                                                    {post.likesCount} likes
                                                </span>
                                            )}

                                            {post.commentsCount !== undefined && (
                                                <span>
                                                    <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                        />
                                                    </svg>
                                                    {post.commentsCount} comments
                                                </span>
                                            )}
                                        </div>

                                        {/* Categories and Tags */}
                                        {(post.categories && post.categories.length > 0) || (post.tags && post.tags.length > 0) ? (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {post.categories?.map((category) => (
                                                    <span key={category.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                                        {category.name}
                                                    </span>
                                                ))}
                                                {post.tags?.map((tag) => (
                                                    <span key={tag.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                                        #{tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-2 ml-4">
                                        <button
                                            onClick={() => handleEditPost(post)}
                                            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => setShowDeleteModal(post)}
                                            className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {(pagination.currentPage - 1) * pagination.postsPerPage + 1} to {Math.min(pagination.currentPage * pagination.postsPerPage, pagination.totalPosts)} of{" "}
                                {pagination.totalPosts} posts
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage <= 1}
                                    className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                                            page === pagination.currentPage ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-500 bg-white hover:bg-gray-50"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage >= pagination.totalPages}
                                    className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shader-md rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Post</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">Are you sure you want to delete "{showDeleteModal.title}"? This action cannot be undone.</p>
                            </div>
                            <div className="flex items-center justify-center space-x-4 px-4 py-3">
                                <button
                                    onClick={() => setShowDeleteModal(null)}
                                    className="px-4 py-2 bg-white text-gray-500 border border-gray-300 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeletePost(showDeleteModal)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
