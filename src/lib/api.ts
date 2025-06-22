import axios from "axios";
import { LoginCredentials, RegisterData, AuthResponse, User } from "@/types/auth";

// Create a single axios instance for all API calls
const api = axios.create({
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Helper to handle API errors consistently
const handleError = (error: any, context: string) => {
    console.error(`[API/${context} ERROR]`, error);
    const message = error.response?.data?.message || error.message || `An error occurred in ${context}.`;
    throw new Error(message);
};

export const authAPI = {
    /**
     * Logs in the user by calling our Next.js API route.
     * The API route handles the actual call to WordPress and sets the HttpOnly cookie.
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const { data } = await api.post("/api/login", credentials);
            return data; // The API route now returns the user and a message
        } catch (error) {
            handleError(error, "LOGIN");
            throw error; // Re-throw after handling to ensure it propagates
        }
    },

    /**
     * Logs out the user by calling our Next.js API route.
     * The API route handles clearing the HttpOnly cookie.
     */
    async logout(): Promise<void> {
        try {
            await api.post("/api/logout");
        } catch (error) {
            handleError(error, "LOGOUT");
        }
    },

    /**
     * Fetches the current user's data from our Next.js API route.
     * This relies on the HttpOnly cookie being sent automatically by the browser.
     */
    async getCurrentUser(): Promise<User> {
        try {
            const { data } = await api.get("/api/me");
            return data.user;
        } catch (error) {
            handleError(error, "GET_CURRENT_USER");
            // The return statement below is for type-safety, as handleError always throws.
            throw new Error("Failed to fetch user data");
        }
    },

    /**
     * Registers a new user. This still calls the WordPress API directly,
     * as it's a public endpoint. Consider proxying this as well for consistency.
     */
    async register(userData: RegisterData): Promise<{ message: string; user: User }> {
        const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
        if (!API_BASE) {
            throw new Error("WordPress API URL is not defined");
        }
        try {
            const { data } = await api.post(`${API_BASE}/users/register`, userData);
            return {
                message: data.message || "Registration successful",
                user: data.user || data,
            };
        } catch (error) {
            handleError(error, "REGISTER");
            return { message: "Registration failed", user: null as any };
        }
    },
};

// This is a generic fetcher for SWR or other data-fetching libraries
// that need to interact with protected WordPress endpoints.
export const fetcher = async (url: string) => {
    const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    if (!API_BASE) {
        throw new Error("WordPress API URL is not defined");
    }

    try {
        const { data } = await api.get(`${API_BASE}${url}`);
        return data;
    } catch (error: any) {
        console.error("[FETCHER ERROR]", error);
        const message = error.response?.data?.message || error.message || "Failed to fetch data.";
        throw new Error(message);
    }
};
