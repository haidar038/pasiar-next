// lib/postsAPI.ts
import axios from "axios";
import Cookies from "js-cookie";
import { Post, CreatePostData, UpdatePostData, PostsResponse, PostFilters, Category, Tag, Comment, CreateCommentData } from "@/types/post";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

// Create axios instance with default config
const api = axios.create({
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = Cookies.get("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Transform WordPress post response to match our Post interface
const transformWordPressPost = (wpPost: any): Post => {
    // Map WordPress status to our interface status
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
        default:
            status = "draft";
    }

    return {
        id: wpPost.id,
        title: wpPost.title?.rendered || wpPost.title || "",
        content: wpPost.content?.rendered || wpPost.content || "",
        excerpt: wpPost.excerpt?.rendered || wpPost.excerpt || "",
        status: status,
        author: {
            id: wpPost.author?.id || wpPost.author || 0,
            username: wpPost.author?.username || wpPost.author_name || "",
            displayName: wpPost.author?.displayName || wpPost.author_name || "",
            avatar: wpPost.author?.avatar || "",
        },
        createdAt: wpPost.date || wpPost.created_at || new Date().toISOString(),
        updatedAt: wpPost.modified || wpPost.updated_at || new Date().toISOString(),
        publishedAt: wpPost.status === "publish" ? wpPost.date || wpPost.published_at : undefined,
        featuredImage: wpPost.featured_media_url || wpPost.featured_image || "",
        categories: wpPost.categories || [],
        tags: wpPost.tags || [],
        commentsCount: wpPost.comments_count || 0,
        likesCount: wpPost.likes_count || 0,
        isLiked: wpPost.is_liked || false,
        slug: wpPost.slug || "",
    };
};

export const postsAPI = {
    // Get all posts with filters
    async getPosts(filters: PostFilters = {}): Promise<PostsResponse> {
        try {
            console.log("[PostsAPI] Getting posts with filters:", filters);

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            const params = new URLSearchParams();

            // Add filters to params
            if (filters.status && filters.status !== "all") {
                params.append("status", filters.status);
            }
            if (filters.category) {
                params.append("categories", filters.category.toString());
            }
            if (filters.tag) {
                params.append("tags", filters.tag);
            }
            if (filters.author) {
                params.append("author", filters.author.toString());
            }
            if (filters.search) {
                params.append("search", filters.search);
            }
            if (filters.sortBy) {
                params.append("orderby", filters.sortBy === "date" ? "date" : filters.sortBy);
            }
            if (filters.sortOrder) {
                params.append("order", filters.sortOrder);
            }
            if (filters.page) {
                params.append("page", filters.page.toString());
            }
            if (filters.limit) {
                params.append("per_page", filters.limit.toString());
            }

            const response = await api.get(`${API_BASE}/posts?${params.toString()}`);
            console.log("[PostsAPI] Posts response:", response.data);

            // Handle both array response and paginated response
            const posts = Array.isArray(response.data) ? response.data : response.data.posts || [];
            const transformedPosts = posts.map(transformWordPressPost);

            return {
                posts: transformedPosts,
                pagination: {
                    currentPage: filters.page || 1,
                    totalPages: parseInt(response.headers["x-wp-totalpages"]) || 1,
                    totalPosts: parseInt(response.headers["x-wp-total"]) || posts.length,
                    postsPerPage: filters.limit || 10,
                },
            };
        } catch (error: any) {
            console.error("[PostsAPI] Get posts error:", error.response?.data || error.message);
            throw error;
        }
    },

    // Get user's posts
    async getUserPosts(userId?: number, filters: PostFilters = {}): Promise<PostsResponse> {
        try {
            const userFilters = { ...filters, author: userId };
            return await this.getPosts(userFilters);
        } catch (error: any) {
            console.error("[PostsAPI] Get user posts error:", error.response?.data || error.message);
            throw error;
        }
    },

    // Get single post by ID
    async getPost(id: number): Promise<Post> {
        try {
            console.log("[PostsAPI] Getting post:", id);

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            const response = await api.get(`${API_BASE}/posts/${id}`);
            console.log("[PostsAPI] Post response:", response.data);

            return transformWordPressPost(response.data);
        } catch (error: any) {
            console.error("[PostsAPI] Get post error:", error.response?.data || error.message);
            throw error;
        }
    },

    // Get post by slug
    async getPostBySlug(slug: string): Promise<Post> {
        try {
            console.log("[PostsAPI] Getting post by slug:", slug);

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            const response = await api.get(`${API_BASE}/posts?slug=${slug}`);
            console.log("[PostsAPI] Post by slug response:", response.data);

            if (!response.data || response.data.length === 0) {
                throw new Error("Post not found");
            }

            return transformWordPressPost(response.data[0]);
        } catch (error: any) {
            console.error("[PostsAPI] Get post by slug error:", error.response?.data || error.message);
            throw error;
        }
    },

    // Create new post
    async createPost(postData: CreatePostData): Promise<Post> {
        try {
            console.log("[PostsAPI] Creating post:", postData);

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            // Transform data for WordPress API
            const wpPostData: any = {
                title: postData.title,
                content: postData.content,
                excerpt: postData.excerpt,
                status: postData.status,
                categories: postData.categories,
                tags: postData.tags,
            };

            // Handle featured_media - only include if it's a valid integer
            if (postData.featuredImage) {
                const featuredMediaId = parseInt(postData.featuredImage);
                if (!isNaN(featuredMediaId) && featuredMediaId > 0) {
                    wpPostData.featured_media = featuredMediaId;
                }
                // If it's not a valid integer, we skip it rather than causing an error
                // You might want to handle image upload separately or use a different field
            }

            const response = await api.post(`${API_BASE}/posts`, wpPostData);
            console.log("[PostsAPI] Create post response:", response.data);

            return transformWordPressPost(response.data);
        } catch (error: any) {
            console.error("[PostsAPI] Create post error:", error.response?.data || error.message);
            throw error;
        }
    },

    // Update post
    // Fixed updatePost method in postsAPI.ts
    async updatePost(postData: UpdatePostData): Promise<Post> {
        try {
            console.log("[PostsAPI] Updating post:", postData);

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            const { id, ...updateData } = postData;

            // Transform data for WordPress API
            const wpPostData: any = {
                title: updateData.title,
                content: updateData.content,
                excerpt: updateData.excerpt,
                categories: updateData.categories,
                tags: updateData.tags,
            };

            // Handle status mapping (same as createPost)
            if (updateData.status) {
                switch (updateData.status) {
                    case "published":
                        wpPostData.status = "publish";
                        break;
                    case "draft":
                        wpPostData.status = "draft";
                        break;
                    case "private":
                        wpPostData.status = "private";
                        break;
                    default:
                        wpPostData.status = "draft";
                }
            }

            // Handle featured_media - only include if it's a valid integer
            if (updateData.featuredImage !== undefined) {
                if (updateData.featuredImage) {
                    const featuredMediaId = parseInt(updateData.featuredImage);
                    if (!isNaN(featuredMediaId) && featuredMediaId > 0) {
                        wpPostData.featured_media = featuredMediaId;
                    }
                } else {
                    // If featuredImage is empty string or null, remove the featured image
                    wpPostData.featured_media = 0;
                }
            }

            console.log("[PostsAPI] Sending update to WordPress:", wpPostData);

            const response = await api.put(`${API_BASE}/posts/${id}`, wpPostData);
            console.log("[PostsAPI] Update post response:", response.data);

            return transformWordPressPost(response.data);
        } catch (error: any) {
            console.error("[PostsAPI] Update post error:", error.response?.data || error.message);

            // Log more detailed error information
            if (error.response?.data) {
                console.error("[PostsAPI] Error details:", {
                    code: error.response.data.code,
                    message: error.response.data.message,
                    data: error.response.data.data,
                });
            }

            throw error;
        }
    },

    // Delete post
    async deletePost(id: number): Promise<void> {
        try {
            console.log("[PostsAPI] Deleting post:", id);

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            await api.delete(`${API_BASE}/posts/${id}`);
            console.log("[PostsAPI] Post deleted successfully");
        } catch (error: any) {
            console.error("[PostsAPI] Delete post error:", error.response?.data || error.message);
            throw error;
        }
    },

    // Get categories
    async getCategories(): Promise<Category[]> {
        try {
            console.log("[PostsAPI] Getting categories");

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            const response = await api.get(`${API_BASE}/categories`);
            console.log("[PostsAPI] Categories response:", response.data);

            return response.data.map((cat: any) => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                color: cat.color || "#3B82F6",
            }));
        } catch (error: any) {
            console.error("[PostsAPI] Get categories error:", error.response?.data || error.message);
            throw error;
        }
    },

    // Get tags
    async getTags(): Promise<Tag[]> {
        try {
            console.log("[PostsAPI] Getting tags");

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            const response = await api.get(`${API_BASE}/tags`);
            console.log("[PostsAPI] Tags response:", response.data);

            return response.data.map((tag: any) => ({
                id: tag.id,
                name: tag.name,
                slug: tag.slug,
                color: tag.color || "#10B981",
            }));
        } catch (error: any) {
            console.error("[PostsAPI] Get tags error:", error.response?.data || error.message);
            throw error;
        }
    },

    // Like/Unlike post
    async toggleLike(postId: number): Promise<{ liked: boolean; likesCount: number }> {
        try {
            console.log("[PostsAPI] Toggling like for post:", postId);

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            const response = await api.post(`${API_BASE}/posts/${postId}/like`);
            console.log("[PostsAPI] Toggle like response:", response.data);

            return {
                liked: response.data.liked,
                likesCount: response.data.likes_count,
            };
        } catch (error: any) {
            console.error("[PostsAPI] Toggle like error:", error.response?.data || error.message);
            throw error;
        }
    },

    // Get post comments
    async getComments(postId: number): Promise<Comment[]> {
        try {
            console.log("[PostsAPI] Getting comments for post:", postId);

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            const response = await api.get(`${API_BASE}/comments?post=${postId}`);
            console.log("[PostsAPI] Comments response:", response.data);

            return response.data.map((comment: any) => ({
                id: comment.id,
                content: comment.content?.rendered || comment.content,
                author: {
                    id: comment.author,
                    username: comment.author_name,
                    displayName: comment.author_name,
                    avatar: comment.author_avatar_urls?.["48"] || "",
                },
                postId: comment.post,
                parentId: comment.parent || undefined,
                createdAt: comment.date,
                updatedAt: comment.date,
                likesCount: comment.likes_count || 0,
                isLiked: comment.is_liked || false,
            }));
        } catch (error: any) {
            console.error("[PostsAPI] Get comments error:", error.response?.data || error.message);
            throw error;
        }
    },

    // Create comment
    async createComment(commentData: CreateCommentData): Promise<Comment> {
        try {
            console.log("[PostsAPI] Creating comment:", commentData);

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            const response = await api.post(`${API_BASE}/comments`, {
                content: commentData.content,
                post: commentData.postId,
                parent: commentData.parentId,
            });
            console.log("[PostsAPI] Create comment response:", response.data);

            return {
                id: response.data.id,
                content: response.data.content?.rendered || response.data.content,
                author: {
                    id: response.data.author,
                    username: response.data.author_name,
                    displayName: response.data.author_name,
                    avatar: response.data.author_avatar_urls?.["48"] || "",
                },
                postId: response.data.post,
                parentId: response.data.parent || undefined,
                createdAt: response.data.date,
                updatedAt: response.data.date,
                likesCount: 0,
                isLiked: false,
            };
        } catch (error: any) {
            console.error("[PostsAPI] Create comment error:", error.response?.data || error.message);
            throw error;
        }
    },
};
