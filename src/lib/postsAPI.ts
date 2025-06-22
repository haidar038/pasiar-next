// lib/postsAPI.ts
import axios from "axios";
import { Post, CreatePostData, UpdatePostData, PostsResponse, PostFilters, Category, Tag, Comment, CreateCommentData } from "@/types/post";

// Use a single, configured axios instance
const api = axios.create({
    timeout: 15000,
});

// Helper to handle API errors consistently
const handleError = (error: any, context: string) => {
    console.error(`[PostsAPI/${context} ERROR]`, error.response?.data || error.message);

    // Extract detailed error information if available
    const errorDetails = error.response?.data?.details || {};
    const errorParams = Object.keys(errorDetails).length > 0 ? `Invalid parameter(s): ${Object.keys(errorDetails).join(", ")}` : "";

    const message = error.response?.data?.message || error.message || `An error occurred in ${context}.`;
    const fullMessage = errorParams ? `${message}. ${errorParams}` : message;

    throw new Error(fullMessage);
};

// The transform function remains useful for ensuring data consistency
const transformWordPressPost = (wpPost: any): Post => {
    let status: "draft" | "published" | "private" = "draft";
    switch (wpPost.status) {
        case "publish":
            status = "published";
            break;
        case "draft":
            status = "draft";
            break;
        case "private":
            status = "private";
            break;
    }
    return {
        id: wpPost.id,
        title: wpPost.title?.rendered || wpPost.title || "",
        content: wpPost.content?.rendered || wpPost.content || "",
        excerpt: wpPost.excerpt?.rendered || wpPost.excerpt || "",
        status: status,
        author: {
            id: wpPost.author || 0,
            username: wpPost._embedded?.author?.[0]?.slug || "",
            displayName: wpPost._embedded?.author?.[0]?.name || "",
            avatar: wpPost._embedded?.author?.[0]?.avatar_urls?.["96"] || "",
        },
        createdAt: wpPost.date,
        updatedAt: wpPost.modified,
        publishedAt: wpPost.status === "publish" ? wpPost.date : undefined,
        featuredImage: wpPost._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "",
        categories: wpPost._embedded?.["wp:term"]?.[0]?.map((cat: any) => ({ id: cat.id, name: cat.name, slug: cat.slug })) || [],
        tags: wpPost._embedded?.["wp:term"]?.[1]?.map((tag: any) => ({ id: tag.id, name: tag.name, slug: tag.slug })) || [],
        commentsCount: wpPost.comments_count || 0,
        likesCount: wpPost.likes_count || 0,
        isLiked: wpPost.is_liked || false,
        slug: wpPost.slug || "",
    };
};

export const postsAPI = {
    /**
     * Fetches posts by calling our Next.js API route.
     * This route handles authentication and forwards the request to WordPress.
     */
    async getPosts(filters: PostFilters = {}): Promise<PostsResponse> {
        try {
            const params = new URLSearchParams();
            // Always embed author and media for richer data
            params.append("_embed", "true");

            // Add filters to params
            if (filters.status && filters.status !== "all") {
                // Convert our app status to WordPress API status
                const wpStatus = filters.status === "published" ? "publish" : filters.status;
                params.append("status", wpStatus);
            } else {
                // When 'all' is selected, fetch all relevant statuses
                params.append("status", "publish,draft,private,pending");
            }
            if (filters.category) params.append("categories", filters.category.toString());
            if (filters.tag) params.append("tags", filters.tag);
            if (filters.author) params.append("author", filters.author.toString());
            if (filters.search) params.append("search", filters.search);
            if (filters.sortBy) params.append("orderby", filters.sortBy);
            if (filters.sortOrder) params.append("order", filters.sortOrder);
            if (filters.page) params.append("page", filters.page.toString());
            if (filters.limit) params.append("per_page", filters.limit.toString());

            const response = await api.get(`/api/posts?${params.toString()}`);

            const posts = response.data.map(transformWordPressPost);

            return {
                posts,
                pagination: {
                    currentPage: filters.page || 1,
                    totalPages: parseInt(response.headers["x-wp-totalpages"]) || 1,
                    totalPosts: parseInt(response.headers["x-wp-total"]) || posts.length,
                    postsPerPage: filters.limit || 10,
                },
            };
        } catch (error) {
            handleError(error, "GET_POSTS");
            throw error;
        }
    },

    /**
     * A convenience method to get posts for a specific user.
     */
    async getUserPosts(userId?: number, filters: PostFilters = {}): Promise<PostsResponse> {
        return this.getPosts({ ...filters, author: userId });
    },

    /**
     * Fetch a single post by ID
     */
    async getPost(id: number): Promise<Post> {
        try {
            const response = await api.get(`/api/posts/${id}?_embed=true`);
            return transformWordPressPost(response.data);
        } catch (error) {
            handleError(error, "GET_POST");
            throw error;
        }
    },

    /**
     * Fetch a single post by slug
     */
    async getPostBySlug(slug: string): Promise<Post> {
        try {
            const response = await api.get(`/api/posts?slug=${slug}&_embed=true`);
            if (response.data.length === 0) {
                throw new Error("Post not found");
            }
            return transformWordPressPost(response.data[0]);
        } catch (error) {
            handleError(error, "GET_POST_BY_SLUG");
            throw error;
        }
    },

    async createPost(postData: CreatePostData): Promise<Post> {
        try {
            // This now calls our own secure API route
            const response = await api.post("/api/posts", postData);
            return transformWordPressPost(response.data);
        } catch (error) {
            handleError(error, "CREATE_POST");
            throw error;
        }
    },

    async updatePost(postData: UpdatePostData): Promise<Post> {
        const { id, ...updateData } = postData;
        try {
            // Log what we're sending to the API
            console.log("Updating post with data:", { id, ...updateData });

            const response = await api.put(`/api/posts/${id}`, updateData);
            return transformWordPressPost(response.data);
        } catch (error) {
            handleError(error, "UPDATE_POST");
            throw error;
        }
    },

    async deletePost(id: number): Promise<void> {
        try {
            await api.delete(`/api/posts/${id}`);
        } catch (error) {
            handleError(error, "DELETE_POST");
            throw error;
        }
    },

    /**
     * Fetches all categories from our Next.js API route.
     */
    async getCategories(): Promise<Category[]> {
        try {
            const { data } = await api.get("/api/categories");
            return data.map((cat: any) => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
            }));
        } catch (error) {
            handleError(error, "GET_CATEGORIES");
            throw error;
        }
    },

    /**
     * Fetches all tags from our Next.js API route.
     */
    async getTags(): Promise<Tag[]> {
        try {
            const { data } = await api.get("/api/tags");
            return data.map((tag: any) => ({
                id: tag.id,
                name: tag.name,
                slug: tag.slug,
            }));
        } catch (error) {
            handleError(error, "GET_TAGS");
            throw error;
        }
    },

    /**
     * Toggle like for a post
     */
    async toggleLike(postId: number): Promise<{ liked: boolean; likesCount: number }> {
        try {
            const response = await api.post(`/api/posts/${postId}/like`);
            return {
                liked: response.data.liked,
                likesCount: response.data.likesCount,
            };
        } catch (error) {
            handleError(error, "TOGGLE_LIKE");
            throw error;
        }
    },

    /**
     * Fetch comments for a post
     */
    async getComments(postId: number): Promise<Comment[]> {
        try {
            const response = await api.get(`/api/posts/${postId}/comments`);
            return response.data.map((comment: any) => ({
                id: comment.id,
                content: comment.content?.rendered || comment.content || "",
                author: {
                    id: comment.author || 0,
                    username: comment.author_name || "",
                    displayName: comment.author_name || "",
                    avatar: comment.author_avatar_urls?.["96"] || "",
                },
                postId: comment.post,
                parentId: comment.parent || undefined,
                createdAt: comment.date,
                updatedAt: comment.date,
                likesCount: comment.likes_count || 0,
                isLiked: comment.is_liked || false,
            }));
        } catch (error) {
            handleError(error, "GET_COMMENTS");
            throw error;
        }
    },

    /**
     * Create a new comment
     */
    async createComment(commentData: CreateCommentData): Promise<Comment> {
        try {
            const response = await api.post(`/api/posts/${commentData.postId}/comments`, commentData);
            return {
                id: response.data.id,
                content: response.data.content?.rendered || response.data.content || "",
                author: {
                    id: response.data.author || 0,
                    username: response.data.author_name || "",
                    displayName: response.data.author_name || "",
                    avatar: response.data.author_avatar_urls?.["96"] || "",
                },
                postId: response.data.post,
                parentId: response.data.parent || undefined,
                createdAt: response.data.date,
                updatedAt: response.data.date,
                likesCount: response.data.likes_count || 0,
                isLiked: response.data.is_liked || false,
            };
        } catch (error) {
            handleError(error, "CREATE_COMMENT");
            throw error;
        }
    },
};
