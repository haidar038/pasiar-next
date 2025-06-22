import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
    // Invalidate the cookie by setting its maxAge to -1
    const cookie = serialize("auth_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        maxAge: -1, // Expire the cookie immediately
        sameSite: "lax",
        path: "/",
    });

    const response = NextResponse.json({ message: "Logout successful" });
    response.headers.set("Set-Cookie", cookie);

    return response;
}
