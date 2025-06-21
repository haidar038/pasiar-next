import axios from "axios";
import Cookies from "js-cookie";
import { LoginCredentials, RegisterData, AuthResponse, User } from "@/types/auth";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const JWT_BASE = process.env.NEXT_PUBLIC_JWT_AUTH_URL;

// Create axios instance with default config
const api = axios.create({
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = Cookies.get("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Transform WordPress JWT response to match our User interface
const transformWordPressUser = (wpResponse: any): User => {
    // Handle both direct user data and nested data structure
    const userData = wpResponse.data || wpResponse;

    return {
        id: parseInt(userData.user?.id || userData.id || "0"),
        username: userData.user_nicename || userData.username || "",
        email: userData.user_email || userData.email || "",
        displayName: userData.user_display_name || userData.displayName || userData.user_nicename || userData.username || "",
        firstName: userData.first_name || userData.firstName || "",
        lastName: userData.last_name || userData.lastName || "",
        avatar: userData.avatar || "",
    };
};

export const authAPI = {
    // Login user
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            console.log("[API] Login request:", { username: credentials.username });

            if (!JWT_BASE) {
                throw new Error("JWT authentication URL is not defined");
            }

            const response = await api.post(`${JWT_BASE}/token`, credentials);
            console.log("[API] Login response:", response.data);

            // Transform WordPress response to match our interface
            const user = transformWordPressUser(response.data);

            return {
                token: response.data.token,
                user,
                message: response.data.message || "Login successful",
            };
        } catch (error: any) {
            console.error("[API] Login error:", error.response?.data || error.message);
            throw error;
        }
    },

    // Register user
    async register(userData: RegisterData): Promise<{ message: string; user: User }> {
        try {
            console.log("[API] Register request:", {
                username: userData.username,
                email: userData.email,
            });

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            const response = await api.post(`${API_BASE}/users/register`, {
                username: userData.username,
                email: userData.email,
                password: userData.password,
                first_name: userData.firstName,
                last_name: userData.lastName,
            });

            console.log("[API] Register response:", response.data);

            return {
                message: response.data.message || "Registration successful",
                user: transformWordPressUser(response.data.user || response.data),
            };
        } catch (error: any) {
            console.error("[API] Register error:", error.response?.data || error.message);
            throw error;
        }
    },

    // Validate token
    async validateToken(): Promise<User | null> {
        try {
            console.log("[API] Validating token...");

            if (!JWT_BASE) {
                throw new Error("JWT authentication URL is not defined");
            }

            const response = await api.post(`${JWT_BASE}/token/validate`);
            console.log("[API] Token validation response:", response.data);

            if (response.data && response.data.code === "jwt_auth_valid_token") {
                // Token is valid, but we need to get user data
                return await this.getCurrentUser();
            }

            // If validation response includes user data directly
            if (response.data.data || response.data.user) {
                return transformWordPressUser(response.data);
            }

            return null;
        } catch (error: any) {
            console.error("[API] Token validation error:", error.response?.data || error.message);
            return null;
        }
    },

    // Get current user - alternative method if token validation doesn't return user data
    async getCurrentUser(): Promise<User> {
        try {
            console.log("[API] Getting current user...");

            // Try WordPress REST API me endpoint first
            try {
                if (!API_BASE) {
                    throw new Error("WordPress API URL is not defined");
                }
                const response = await api.get(`${API_BASE}/users/me`);
                console.log("[API] Current user response (custom):", response.data);
                return transformWordPressUser(response.data);
            } catch (customError) {
                console.log("[API] Custom endpoint failed, trying WordPress REST API...");

                // Fallback to standard WordPress REST API
                const baseUrl = API_BASE ? API_BASE.replace("/wp-json/wp/v2", "") : "";
                const wpResponse = await api.get(`${baseUrl}/wp-json/wp/v2/users/me`);
                console.log("[API] Current user response (WP REST):", wpResponse.data);

                return {
                    id: wpResponse.data.id,
                    username: wpResponse.data.slug,
                    email: wpResponse.data.email || "",
                    displayName: wpResponse.data.name,
                    firstName: wpResponse.data.first_name || "",
                    lastName: wpResponse.data.last_name || "",
                    avatar: wpResponse.data.avatar_urls?.["96"] || "",
                };
            }
        } catch (error: any) {
            console.error("[API] Get current user error:", error.response?.data || error.message);
            throw error;
        }
    },
};
