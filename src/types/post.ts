// types/post.ts
export interface Post {
    id: number;
    title: string;
    content: string;
    excerpt?: string;
    status: "draft" | "published" | "private";
    author: {
        id: number;
        username: string;
        displayName: string;
        avatar?: string;
    };
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    featuredImage?: string; // This will be the URL from WordPress
    categories?: Category[];
    tags?: Tag[];
    commentsCount?: number;
    likesCount?: number;
    isLiked?: boolean;
    slug: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color?: string;
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
    color?: string;
}

export interface CreatePostData {
    title: string;
    content: string;
    excerpt?: string;
    status: "draft" | "published" | "private";
    featuredImage?: string; // This should be the media attachment ID as string, or URL if you handle upload separately
    categories?: number[];
    tags?: string[];
}

export interface UpdatePostData extends Partial<CreatePostData> {
    id: number;
}

export interface PostsResponse {
    posts: Post[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalPosts: number;
        postsPerPage: number;
    };
}

export interface PostFilters {
    status?: "draft" | "published" | "private" | "all";
    category?: number;
    tag?: string;
    author?: number;
    search?: string;
    sortBy?: "date" | "title" | "likes" | "comments";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
}

export interface Comment {
    id: number;
    content: string;
    author: {
        id: number;
        username: string;
        displayName: string;
        avatar?: string;
    };
    postId: number;
    parentId?: number;
    createdAt: string;
    updatedAt: string;
    likesCount: number;
    isLiked: boolean;
    replies?: Comment[];
}

export interface CreateCommentData {
    content: string;
    postId: number;
    parentId?: number;
}

// Additional type for media uploads
export interface MediaUploadResponse {
    id: number;
    url: string;
    title: string;
    filename: string;
    filesize: number;
    mime_type: string;
}
