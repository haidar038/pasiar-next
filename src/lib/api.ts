import axios from "axios";
import Cookies from "js-cookie";
import { LoginCredentials, RegisterData, AuthResponse, User } from "@/types/auth";

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const JWT_BASE = process.env.NEXT_PUBLIC_JWT_AUTH_URL;

// Create axios instance with default config
const api = axios.create({
    timeout: 15000, // Increased timeout
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

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't remove token on network errors or temporary failures
        if (error.response?.status === 401 || error.response?.status === 403) {
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
            // Only remove token if we're sure it's invalid (not just a network issue)
            if (error.response?.data?.code === 'jwt_auth_invalid_token' || 
                error.response?.data?.code === 'jwt_auth_no_auth_header') {
                console.log("[API] Token is invalid, will be removed by auth context");
            }
        }
        return Promise.reject(error);
    }
);

// Transform WordPress JWT response to match our User interface
const transformWordPressUser = (wpResponse: any): User => {
    // Handle both direct user data and nested data structure
    const userData = wpResponse.data || wpResponse;

    return {
        id: parseInt(userData.user?.id || userData.id || userData.ID || "0"),
        username: userData.user_nicename || userData.username || userData.user_login || "",
        email: userData.user_email || userData.email || "",
        displayName: userData.user_display_name || userData.displayName || userData.display_name || userData.user_nicename || userData.username || "",
        firstName: userData.first_name || userData.firstName || userData.meta?.first_name || "",
        lastName: userData.last_name || userData.lastName || userData.meta?.last_name || "",
        avatar: userData.avatar || userData.avatar_urls?.["96"] || "",
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

            if (!response.data.token) {
                throw new Error("No token received from server");
            }

            // Transform WordPress response to match our interface
            const user = transformWordPressUser(response.data);

            return {
                token: response.data.token,
                user,
                message: response.data.message || "Login successful",
            };
        } catch (error: any) {
            console.error("[API] Login error:", error);
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.data?.message || 
                               error.message || 
                               "Login failed";
            throw new Error(errorMessage);
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
                first_name: userData.firstName || "",
                last_name: userData.lastName || "",
            });

            console.log("[API] Register response:", response.data);

            return {
                message: response.data.message || "Registration successful",
                user: transformWordPressUser(response.data.user || response.data),
            };
        } catch (error: any) {
            console.error("[API] Register error:", error);
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.data?.message || 
                               error.message || 
                               "Registration failed";
            throw new Error(errorMessage);
        }
    },

    // Validate token - improved logic
    async validateToken(): Promise<{ isValid: boolean; user?: User }> {
        try {
            const token = Cookies.get("auth_token");
            if (!token) {
                console.log("[API] No token found for validation");
                return { isValid: false };
            }

            console.log("[API] Validating token...");

            if (!JWT_BASE) {
                throw new Error("JWT authentication URL is not defined");
            }

            const response = await api.post(`${JWT_BASE}/token/validate`);
            console.log("[API] Token validation response:", response.data);

            // WordPress JWT Auth plugin returns different response structures
            if (response.data && 
                (response.data.code === "jwt_auth_valid_token" || 
                 response.data.success === true ||
                 response.status === 200)) {
                
                // Try to get user data from validation response
                if (response.data.data && response.data.data.user) {
                    const user = transformWordPressUser(response.data.data);
                    return { isValid: true, user };
                }
                
                // If no user data in validation, fetch it separately
                try {
                    const user = await this.getCurrentUser();
                    return { isValid: true, user };
                } catch (userError) {
                    console.error("[API] Could not fetch user data after token validation:", userError);
                    return { isValid: true }; // Token is valid but no user data
                }
            }

            return { isValid: false };
        } catch (error: any) {
            console.error("[API] Token validation error:", error);
            
            // Check if it's a network error vs authentication error
            if (!error.response) {
                // Network error - don't invalidate token
                console.log("[API] Network error during validation, assuming token is still valid");
                return { isValid: true }; // Assume valid on network errors
            }
            
            // Check specific error codes
            if (error.response.status === 401 || 
                error.response?.data?.code === 'jwt_auth_invalid_token' ||
                error.response?.data?.code === 'jwt_auth_no_auth_header') {
                return { isValid: false };
            }

            // For other errors, assume token might still be valid
            console.log("[API] Assuming token is valid due to unclear error");
            return { isValid: true };
        }
    },

    // Get current user - improved with better error handling
    async getCurrentUser(): Promise<User> {
        try {
            console.log("[API] Getting current user...");

            if (!API_BASE) {
                throw new Error("WordPress API URL is not defined");
            }

            // Try custom endpoint first
            try {
                const response = await api.get(`${API_BASE}/users/me`);
                console.log("[API] Current user response (custom):", response.data);
                return transformWordPressUser(response.data);
            } catch (customError) {
                console.log("[API] Custom endpoint failed, trying WordPress REST API...");

                // Fallback to standard WordPress REST API
                const baseUrl = API_BASE.replace("/wp-json/wp/v2", "").replace("/wp-json/custom/v1", "");
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
            console.error("[API] Get current user error:", error);
            throw new Error("Failed to fetch user data");
        }
    },

    // Refresh token if your WordPress setup supports it
    async refreshToken(): Promise<string | null> {
        try {
            if (!JWT_BASE) return null;

            const response = await api.post(`${JWT_BASE}/token/refresh`);
            
            if (response.data && response.data.token) {
                console.log("[API] Token refreshed successfully");
                return response.data.token;
            }
            
            return null;
        } catch (error) {
            console.error("[API] Token refresh failed:", error);
            return null;
        }
    }
};