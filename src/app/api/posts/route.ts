import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

export async function GET(req: NextRequest) {
    const token = req.cookies.get("auth_token")?.value;
    const { searchParams } = new URL(req.url);

    if (!API_BASE) {
        console.error("WordPress API URL is not defined in environment variables.");
        return NextResponse.json({ message: "API service is not configured" }, { status: 500 });
    }

    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        // If a token exists, add it to the request to fetch protected posts (e.g., drafts)
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Get the raw query string from the incoming request
        const queryString = req.nextUrl.search;

        const apiResponse = await axios.get(`${API_BASE}/posts${queryString}`, {
            headers,
        });

        // Forward the pagination headers from WordPress to our client
        const response = NextResponse.json(apiResponse.data);
        const totalPages = apiResponse.headers["x-wp-totalpages"];
        const totalPosts = apiResponse.headers["x-wp-total"];

        if (totalPages) {
            response.headers.set("x-wp-totalpages", totalPages);
        }
        if (totalPosts) {
            response.headers.set("x-wp-total", totalPosts);
        }

        return response;
    } catch (error: any) {
        console.error("[API/POSTS GET ERROR]", error.response?.data || error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "An error occurred while fetching posts.";
        const errorDetails = error.response?.data?.data?.params || {};

        return NextResponse.json(
            {
                message,
                details: errorDetails,
            },
            { status }
        );
    }
}

export async function POST(req: NextRequest) {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    if (!API_BASE) {
        console.error("WordPress API URL is not defined in environment variables.");
        return NextResponse.json({ message: "API service is not configured" }, { status: 500 });
    }

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };

    try {
        // First, get the current user's data to check their role
        const { data: currentUser } = await axios.get(`${API_BASE}/users/me`, {
            headers,
            params: { context: "edit" },
        });
        const isContributor = currentUser.roles.includes("contributor");

        const body = await req.json();
        const { tags, ...postData } = body;

        // Handle tags: convert names to IDs based on user role
        if (tags && tags.length > 0) {
            const tagIds = await Promise.all(
                tags.map(async (tagName: string) => {
                    try {
                        const searchResponse = await axios.get(`${API_BASE}/tags`, { headers, params: { search: tagName } });
                        if (searchResponse.data.length > 0) {
                            return searchResponse.data[0].id;
                        } else if (!isContributor) {
                            // Only create tags if the user is not a contributor
                            const createResponse = await axios.post(`${API_BASE}/tags`, { name: tagName }, { headers });
                            return createResponse.data.id;
                        }
                        // For contributors, if a tag doesn't exist, ignore it
                        return null;
                    } catch (tagError) {
                        console.error(`Failed to process tag: ${tagName}`, tagError);
                        return null;
                    }
                })
            );
            postData.tags = tagIds.filter((id) => id !== null);
        }

        // Server-side enforcement of contributor rules
        if (isContributor) {
            postData.status = "draft"; // Force status to draft
        }

        // Ensure content and excerpt are properly formatted
        if (postData.content && typeof postData.content === "string") {
            postData.content = { raw: postData.content };
        }

        if (postData.excerpt && typeof postData.excerpt === "string") {
            postData.excerpt = { raw: postData.excerpt };
        }

        // Ensure categories are properly formatted
        if (postData.categories) {
            console.log("Processing categories for new post:", postData.categories);

            // Handle different formats of categories
            if (Array.isArray(postData.categories)) {
                // Ensure all category IDs are numbers
                postData.categories = postData.categories.map((id: number | string) => (typeof id === "string" ? parseInt(id, 10) : id));
            } else if (typeof postData.categories === "string") {
                // Handle case where categories might be a comma-separated string
                postData.categories = postData.categories.split(",").map((id: string) => parseInt(id.trim(), 10));
            } else if (typeof postData.categories === "number") {
                // Handle case where categories might be a single number
                postData.categories = [postData.categories];
            }

            // Filter out any NaN values
            postData.categories = postData.categories.filter((id: any) => !isNaN(id));

            console.log("Final categories for new post:", postData.categories);
        }

        // Log the final data being sent to WordPress
        console.log("Final data being sent to WordPress API for new post:", JSON.stringify(postData, null, 2));

        // Create the post with the processed and validated data
        const apiResponse = await axios.post(`${API_BASE}/posts`, postData, { headers });

        // Log the response from WordPress
        console.log("WordPress API response for new post:", apiResponse.status);

        return NextResponse.json(apiResponse.data, { status: 201 });
    } catch (error: any) {
        console.error("[API/POSTS POST ERROR]", error.response?.data || error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "An error occurred while creating the post.";
        return NextResponse.json({ message }, { status });
    }
}
