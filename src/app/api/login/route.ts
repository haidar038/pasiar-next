import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { serialize } from "cookie";

const JWT_BASE = process.env.NEXT_PUBLIC_JWT_AUTH_URL;

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
        return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
    }

    if (!JWT_BASE) {
        console.error("JWT authentication URL is not defined in environment variables.");
        return NextResponse.json({ message: "Authentication service is not configured" }, { status: 500 });
    }

    try {
        // Forward credentials to WordPress JWT endpoint
        const { data } = await axios.post(`${JWT_BASE}/token`, {
            username,
            password,
        });

        if (!data.token) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        // Serialize the cookie
        const cookie = serialize("auth_token", data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            sameSite: "lax",
            path: "/",
        });

        // Create the response with the user data and the Set-Cookie header
        const response = NextResponse.json({
            user: {
                id: data.user_id,
                email: data.user_email,
                displayName: data.user_display_name,
                nicename: data.user_nicename,
            },
            message: "Login successful",
        });

        response.headers.set("Set-Cookie", cookie);

        return response;
    } catch (error: any) {
        console.error("[API/LOGIN ERROR]", error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "An error occurred during login.";
        return NextResponse.json({ message }, { status });
    }
}
