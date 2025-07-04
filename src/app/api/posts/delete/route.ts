import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { RateLimiter, PerformanceMonitor, WordPressApiOptimizer } from "@/lib/api-utils";
import ErrorHandler, {
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    NotFoundError,
    WordPressApiError,
    RateLimitError,
    createErrorFromWordPressResponse,
    createErrorFromSupabaseError,
    Logger,
} from "@/lib/error-handler";

export const POST = ErrorHandler.wrap(async (request: Request) => {
    const monitor = new PerformanceMonitor("delete_post", {
        method: "DELETE",
        endpoint: "/api/posts/delete",
    });

    // 1. Authentication
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
        throw new AuthenticationError("Authorization token required");
    }

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser(token);
    if (authError) {
        throw createErrorFromSupabaseError(authError);
    }
    if (!user) {
        throw new AuthenticationError("Invalid authentication token");
    }

    monitor.updateContext({ userId: user.id });

    // 2. Rate limiting
    if (!RateLimiter.check(user.id, "delete")) {
        Logger.warn(`Rate limit exceeded for user ${user.id}`, { action: "delete" });
        throw new RateLimitError(5, 60000, { userId: user.id });
    }

    // 3. Parse and validate request body
    let body;
    try {
        body = await request.json();
    } catch (parseError) {
        throw new ValidationError("Invalid JSON format in request body");
    }

    const { postId, cptSlug } = body;

    if (!postId || !cptSlug) {
        throw new ValidationError("Missing required fields", ["postId", "cptSlug"]);
    }

    monitor.updateContext({ postId: postId.toString(), cptSlug });

    // 4. Get WordPress token
    const wpToken = await WordPressApiOptimizer.getOptimizedToken();
    if (!wpToken) {
        Logger.error("Failed to get WordPress token for delete operation", undefined, {
            userId: user.id,
            postId,
            cptSlug,
        });
        throw new WordPressApiError("Server authentication failed");
    }

    // 5. Verify post exists and user owns it
    Logger.info(`Verifying post ownership for deletion`, {
        userId: user.id,
        postId,
        cptSlug,
    });

    const verifyResponse = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/${cptSlug}/${postId}?context=edit`, {
        headers: { Authorization: `Bearer ${wpToken}` },
    });

    if (!verifyResponse.ok) {
        if (verifyResponse.status === 404) {
            throw new NotFoundError("Post", postId.toString());
        }
        const errorData = await verifyResponse.json().catch(() => ({}));
        throw createErrorFromWordPressResponse(verifyResponse, errorData);
    }

    const existingPost = await verifyResponse.json();

    // Check ownership
    if (existingPost.acf?.supabase_user_id !== user.id) {
        Logger.warn(`Unauthorized delete attempt`, {
            userId: user.id,
            postId,
            postOwnerId: existingPost.acf?.supabase_user_id,
        });
        throw new AuthorizationError("You can only delete your own posts");
    }

    // 6. Delete the post
    Logger.info(`Deleting post`, {
        userId: user.id,
        postId,
        cptSlug,
        postTitle: existingPost.title?.rendered,
    });

    const deleteResponse = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/${cptSlug}/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${wpToken}` },
    });

    if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json().catch(() => ({}));
        Logger.error(`WordPress delete failed`, undefined, {
            userId: user.id,
            postId,
            status: deleteResponse.status,
            errorData,
        });
        throw createErrorFromWordPressResponse(deleteResponse, errorData);
    }

    // 7. Success response
    monitor.success();
    Logger.info(`Post deleted successfully`, {
        userId: user.id,
        postId,
        cptSlug,
    });

    return NextResponse.json(
        {
            success: true,
            message: "Post deleted successfully",
            code: "DELETE_SUCCESS",
            timestamp: new Date().toISOString(),
            data: {
                postId,
                cptSlug,
            },
        },
        { status: 200 }
    );
});
