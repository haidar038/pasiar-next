import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

export async function GET(req: NextRequest) {
    if (!API_BASE) {
        console.error("WordPress API URL is not defined in environment variables.");
        return NextResponse.json({ message: "API service is not configured" }, { status: 500 });
    }

    try {
        const apiResponse = await axios.get(`${API_BASE}/tags`, {
            params: {
                per_page: 100, // Fetch up to 100 tags
                orderby: "count",
                order: "desc",
            },
        });

        return NextResponse.json(apiResponse.data);
    } catch (error: any) {
        console.error("[API/TAGS GET ERROR]", error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "An error occurred while fetching tags.";
        return NextResponse.json({ message }, { status });
    }
}
