import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const JWT_BASE = process.env.NEXT_PUBLIC_JWT_AUTH_URL;

export async function GET(req: NextRequest) {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    if (!JWT_BASE || !API_BASE) {
        console.error("API URLs are not defined in environment variables.");
        return NextResponse.json({ message: "Authentication service is not configured" }, { status: 500 });
    }

    try {
        // 1. Validate the token
        await axios.post(
            `${JWT_BASE}/token/validate`,
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        // 2. If token is valid, fetch user data
        const { data: user } = await axios.get(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { context: "edit" }, // Request more user details
        });

        // 3. Return the user data
        return NextResponse.json({
            user: {
                id: user.id,
                username: user.slug,
                email: user.email,
                displayName: user.name,
                firstName: user.first_name,
                lastName: user.last_name,
                avatar: user.avatar_urls?.["96"],
                roles: user.roles,
            },
        });
    } catch (error: any) {
        console.error("[API/ME ERROR]", error);
        return NextResponse.json({ message: "Session is invalid or has expired." }, { status: 401 });
    }
}
