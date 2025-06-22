import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!API_BASE) {
        console.error("WordPress API URL is not defined in environment variables.");
        return NextResponse.json({ message: "API service is not configured" }, { status: 500 });
    }

    try {
        const apiResponse = await axios.get(`${API_BASE}/comments`, {
            params: {
                post: id,
                per_page: 100,
                orderby: "date",
                order: "asc",
            },
        });

        return NextResponse.json(apiResponse.data);
    } catch (error: any) {
        console.error("[API/COMMENTS GET ERROR]", error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "An error occurred while fetching comments.";
        return NextResponse.json({ message }, { status });
    }
}

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
        const body = await req.json();
        const commentData = {
            ...body,
            post: parseInt(id),
        };

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };

        const apiResponse = await axios.post(`${API_BASE}/comments`, commentData, { headers });

        return NextResponse.json(apiResponse.data, { status: 201 });
    } catch (error: any) {
        console.error("[API/COMMENTS POST ERROR]", error.response?.data || error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "An error occurred while creating the comment.";
        return NextResponse.json({ message }, { status });
    }
}
