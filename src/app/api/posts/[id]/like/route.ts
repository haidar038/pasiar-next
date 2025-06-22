import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get("auth_token")?.value;
    const { id } = await params;

    if (!token) {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    if (!API_BASE) {
        console.error("WordPress API URL is not defined in environment variables.");
        return NextResponse.json({ message: "API service is not configured" }, { status: 500 });
    }

    try {
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };

        // This assumes you have a like/unlike endpoint in your WordPress API
        // You might need to adjust this based on your WordPress setup
        const apiResponse = await axios.post(`${API_BASE}/posts/${id}/like`, {}, { headers });

        return NextResponse.json({
            liked: apiResponse.data.liked,
            likesCount: apiResponse.data.likesCount,
        });
    } catch (error: any) {
        console.error("[API/LIKE POST ERROR]", error.response?.data || error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "An error occurred while toggling like.";
        return NextResponse.json({ message }, { status });
    }
}
