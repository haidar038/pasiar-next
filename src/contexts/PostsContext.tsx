// contexts/PostsContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { postsAPI } from "@/lib/postsAPI";
import { Post, CreatePostData, UpdatePostData, PostsResponse, PostFilters, Category, Tag, Comment, CreateCommentData } from "@/types/post";

interface PostsContextType {
    // State
    posts: Post[];
    currentPost: Post | null;
    categories: Category[];
    tags: Tag[];
    comments: Comment[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalPosts: number;
        postsPerPage: number;
    };
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchPosts: (filters?: PostFilters) => Promise<void>;
    fetchUserPosts: (userId?: number, filters?: PostFilters) => Promise<void>;
    fetchPost: (id: number) => Promise<void>;
    fetchPostBySlug: (slug: string) => Promise<void>;
    createPost: (postData: CreatePostData) => Promise<Post>;
    updatePost: (postData: UpdatePostData) => Promise<Post>;
    deletePost: (id: number) => Promise<void>;
    fetchCategories: () => Promise<void>;
    fetchTags: () => Promise<void>;
    toggleLike: (postId: number) => Promise<void>;
    fetchComments: (postId: number) => Promise<void>;
    createComment: (commentData: CreateCommentData) => Promise<Comment>;
    clearError: () => void;
    clearCurrentPost: () => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: ReactNode }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [currentPost, setCurrentPost] = useState<Post | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalPosts: 0,
        postsPerPage: 10,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = () => setError(null);
    const clearCurrentPost = () => setCurrentPost(null);

    const fetchPosts = async (filters: PostFilters = {}) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await postsAPI.getPosts(filters);
            setPosts(response.posts);
            setPagination(response.pagination);
        } catch (err: any) {
            setError(err.message || "Failed to fetch posts");
            console.error("Fetch posts error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserPosts = async (userId?: number, filters: PostFilters = {}) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await postsAPI.getUserPosts(userId, filters);
            setPosts(response.posts);
            setPagination(response.pagination);
        } catch (err: any) {
            setError(err.message || "Failed to fetch user posts");
            console.error("Fetch user posts error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPost = async (id: number) => {
        try {
            setIsLoading(true);
            setError(null);

            const post = await postsAPI.getPost(id);
            setCurrentPost(post);
        } catch (err: any) {
            setError(err.message || "Failed to fetch post");
            console.error("Fetch post error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPostBySlug = async (slug: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const post = await postsAPI.getPostBySlug(slug);
            setCurrentPost(post);
        } catch (err: any) {
            setError(err.message || "Failed to fetch post");
            console.error("Fetch post by slug error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const createPost = async (postData: CreatePostData): Promise<Post> => {
        try {
            setIsLoading(true);
            setError(null);

            const newPost = await postsAPI.createPost(postData);

            // Add to posts list if it matches current filters
            setPosts((prevPosts) => [newPost, ...prevPosts]);

            return newPost;
        } catch (err: any) {
            setError(err.message || "Failed to create post");
            console.error("Create post error:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const updatePost = async (postData: UpdatePostData): Promise<Post> => {
        try {
            setIsLoading(true);
            setError(null);

            const updatedPost = await postsAPI.updatePost(postData);

            // Update in posts list
            setPosts((prevPosts) => prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post)));

            // Update current post if it's the same
            if (currentPost && currentPost.id === updatedPost.id) {
                setCurrentPost(updatedPost);
            }

            return updatedPost;
        } catch (err: any) {
            setError(err.message || "Failed to update post");
            console.error("Update post error:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const deletePost = async (id: number) => {
        try {
            setIsLoading(true);
            setError(null);

            await postsAPI.deletePost(id);

            // Remove from posts list
            setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));

            // Clear current post if it's the deleted one
            if (currentPost && currentPost.id === id) {
                setCurrentPost(null);
            }
        } catch (err: any) {
            setError(err.message || "Failed to delete post");
            console.error("Delete post error:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const categoriesData = await postsAPI.getCategories();
            setCategories(categoriesData);
        } catch (err: any) {
            console.error("Fetch categories error:", err);
        }
    };

    const fetchTags = async () => {
        try {
            const tagsData = await postsAPI.getTags();
            setTags(tagsData);
        } catch (err: any) {
            console.error("Fetch tags error:", err);
        }
    };

    const toggleLike = async (postId: number) => {
        try {
            const { liked, likesCount } = await postsAPI.toggleLike(postId);

            // Update posts list
            setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, isLiked: liked, likesCount } : post)));

            // Update current post if it's the same
            if (currentPost && currentPost.id === postId) {
                setCurrentPost({ ...currentPost, isLiked: liked, likesCount });
            }
        } catch (err: any) {
            console.error("Toggle like error:", err);
        }
    };

    const fetchComments = async (postId: number) => {
        try {
            const commentsData = await postsAPI.getComments(postId);
            setComments(commentsData);
        } catch (err: any) {
            console.error("Fetch comments error:", err);
        }
    };

    const createComment = async (commentData: CreateCommentData): Promise<Comment> => {
        try {
            const newComment = await postsAPI.createComment(commentData);

            // Add to comments list
            setComments((prevComments) => [...prevComments, newComment]);

            // Update post comments count
            setPosts((prevPosts) => prevPosts.map((post) => (post.id === commentData.postId ? { ...post, commentsCount: (post.commentsCount || 0) + 1 } : post)));

            if (currentPost && currentPost.id === commentData.postId) {
                setCurrentPost({
                    ...currentPost,
                    commentsCount: (currentPost.commentsCount || 0) + 1,
                });
            }

            return newComment;
        } catch (err: any) {
            console.error("Create comment error:", err);
            throw err;
        }
    };

    const value: PostsContextType = {
        // State
        posts,
        currentPost,
        categories,
        tags,
        comments,
        pagination,
        isLoading,
        error,

        // Actions
        fetchPosts,
        fetchUserPosts,
        fetchPost,
        fetchPostBySlug,
        createPost,
        updatePost,
        deletePost,
        fetchCategories,
        fetchTags,
        toggleLike,
        fetchComments,
        createComment,
        clearError,
        clearCurrentPost,
    };

    return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
    const context = useContext(PostsContext);
    if (context === undefined) {
        throw new Error("usePosts must be used within a PostsProvider");
    }
    return context;
}
