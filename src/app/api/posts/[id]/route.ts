import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get("auth_token")?.value;
    const { id } = await params; // Await params here

    if (!token) {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    if (!API_BASE) {
        console.error("WordPress API URL is not defined.");
        return NextResponse.json({ message: "API service is not configured" }, { status: 500 });
    }

    try {
        const headers = { Authorization: `Bearer ${token}` };
        // Add force=true to allow deleting posts to trash instead of permanently
        await axios.delete(`${API_BASE}/posts/${id}`, { headers, params: { force: true } });

        return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("[API/POSTS DELETE ERROR]", error.response?.data || error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "An error occurred while deleting the post.";
        return NextResponse.json({ message }, { status });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get("auth_token")?.value;
    const { id } = await params; // Await params here

    if (!token) {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    if (!API_BASE) {
        console.error("WordPress API URL is not defined.");
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

        // Ensure content is properly formatted for WordPress
        // WordPress expects content and excerpt as objects with raw property
        if (postData.content && typeof postData.content === "string") {
            postData.content = { raw: postData.content };
        }

        if (postData.excerpt && typeof postData.excerpt === "string") {
            postData.excerpt = { raw: postData.excerpt };
        }

        // Log the categories being sent for debugging
        console.log("Categories before update:", postData.categories);

        // Handle tags: convert names to IDs based on user role
        if (tags && tags.length > 0) {
            const tagIds = await Promise.all(
                tags.map(async (tagName: string) => {
                    try {
                        const searchResponse = await axios.get(`${API_BASE}/tags`, { headers, params: { search: tagName } });
                        if (searchResponse.data.length > 0) {
                            return searchResponse.data[0].id;
                        } else if (!isContributor) {
                            const createResponse = await axios.post(`${API_BASE}/tags`, { name: tagName }, { headers });
                            return createResponse.data.id;
                        }
                        return null;
                    } catch (tagError) {
                        console.error(`Failed to process tag: ${tagName}`, tagError);
                        return null;
                    }
                })
            );
            postData.tags = tagIds.filter((tagId) => tagId !== null);
        }

        // Server-side enforcement of contributor rules
        if (isContributor) {
            postData.status = "draft";
            // Contributors cannot modify categories
            delete postData.categories;
        } else {
            // For non-contributors, ensure categories are properly formatted
            // WordPress expects categories as an array of IDs
            if (postData.categories) {
                console.log("Processing categories:", postData.categories);

                // Handle different formats of categories
                if (Array.isArray(postData.categories)) {
                    // Ensure all category IDs are numbers
                    postData.categories = postData.categories.map((id: string | number) => (typeof id === "string" ? parseInt(id, 10) : id));
                } else if (typeof postData.categories === "string") {
                    // Handle case where categories might be a comma-separated string
                    postData.categories = postData.categories.split(",").map((id: string) => parseInt(id.trim(), 10));
                } else if (typeof postData.categories === "number") {
                    // Handle case where categories might be a single number
                    postData.categories = [postData.categories];
                }

                // Filter out any NaN values
                postData.categories = postData.categories.filter((id: any) => !isNaN(id));

                // Rename to the correct WordPress API parameter
                // WordPress uses 'categories' for the parameter name
                console.log("Final categories:", postData.categories);
            }
        }

        // Log the final data being sent to WordPress
        console.log("Final data being sent to WordPress API:", JSON.stringify(postData, null, 2));

        // Update the post with the processed and validated data
        const apiResponse = await axios.put(`${API_BASE}/posts/${id}`, postData, { headers });

        // Log the response from WordPress
        console.log("WordPress API response:", apiResponse.status);

        return NextResponse.json(apiResponse.data);
    } catch (error: any) {
        console.error("[API/POSTS UPDATE ERROR]", error.response?.data || error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "An error occurred while updating the post.";
        return NextResponse.json({ message }, { status });
    }
}
