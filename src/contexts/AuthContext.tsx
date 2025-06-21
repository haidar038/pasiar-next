"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import Cookies from "js-cookie";
import { authAPI } from "@/lib/api";
import { User, LoginCredentials, RegisterData } from "@/types/auth";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isCheckingAuthRef = useRef(false);

    // Improved cookie configuration
    const getCookieOptions = () => ({
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const, // Changed from "strict" to "lax" for better compatibility
        path: "/",
        domain: process.env.NODE_ENV === "production" ? undefined : undefined, // Let browser set domain
    });

    // Check auth status on mount
    useEffect(() => {
        if (!isInitialized) {
            checkAuthStatus();
        }
    }, []);

    // Setup auto-refresh when user is authenticated
    useEffect(() => {
        if (user && isInitialized) {
            // Clear any existing timeout
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }

            // Set up auto-refresh every 25 minutes (before 30-minute typical expiry)
            refreshTimeoutRef.current = setTimeout(() => {
                refreshUser();
            }, 25 * 60 * 1000);

            return () => {
                if (refreshTimeoutRef.current) {
                    clearTimeout(refreshTimeoutRef.current);
                }
            };
        }
    }, [user, isInitialized]);

    const checkAuthStatus = async () => {
        // Prevent multiple simultaneous auth checks
        if (isCheckingAuthRef.current) {
            console.log("[Auth] Auth check already in progress");
            return;
        }

        isCheckingAuthRef.current = true;

        try {
            const token = Cookies.get("auth_token");
            console.log("[Auth] Checking token:", token ? "Token exists" : "No token");

            if (!token) {
                console.log("[Auth] No token found");
                setUser(null);
                setIsLoading(false);
                setIsInitialized(true);
                return;
            }

            // Validate token and get user data
            const validationResult = await authAPI.validateToken();
            console.log("[Auth] Token validation result:", validationResult);

            if (validationResult.isValid) {
                if (validationResult.user) {
                    setUser(validationResult.user);
                    console.log("[Auth] User set from validation:", validationResult.user);
                } else {
                    // Token is valid but no user data, try to fetch user
                    try {
                        const userData = await authAPI.getCurrentUser();
                        setUser(userData);
                        console.log("[Auth] User fetched separately:", userData);
                    } catch (userError) {
                        console.error("[Auth] Failed to fetch user data:", userError);
                        // Token is valid but can't get user data - keep token for now
                        setUser(null);
                    }
                }
            } else {
                console.log("[Auth] Token invalid, removing...");
                clearAuthData();
            }
        } catch (error) {
            console.error("[Auth] Auth check failed:", error);

            // Only clear auth data if we're sure the token is invalid
            // Don't clear on network errors
            if (error instanceof Error && error.message.includes("invalid")) {
                clearAuthData();
            } else {
                console.log("[Auth] Keeping auth data due to unclear error");
            }
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
            isCheckingAuthRef.current = false;
        }
    };

    const clearAuthData = () => {
        console.log("[Auth] Clearing auth data");
        Cookies.remove("auth_token", { path: "/" });
        Cookies.remove("login_time", { path: "/" });
        setUser(null);

        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }
    };

    const refreshUser = useCallback(async () => {
        try {
            const token = Cookies.get("auth_token");
            if (!token) {
                console.log("[Auth] No token for refresh");
                return;
            }

            console.log("[Auth] Refreshing user data...");

            const validationResult = await authAPI.validateToken();

            if (validationResult.isValid) {
                if (validationResult.user) {
                    setUser(validationResult.user);
                    console.log("[Auth] User refreshed:", validationResult.user);
                } else {
                    const userData = await authAPI.getCurrentUser();
                    setUser(userData);
                    console.log("[Auth] User data fetched on refresh:", userData);
                }
            } else {
                console.log("[Auth] Token invalid on refresh, logging out");
                logout();
            }
        } catch (error) {
            console.error("[Auth] User refresh failed:", error);

            // Only logout if we're sure it's an auth error
            if (error instanceof Error && (error.message.includes("invalid") || error.message.includes("unauthorized"))) {
                logout();
            }
        }
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            setIsLoading(true);
            console.log("[Auth] Attempting login...");

            const response = await authAPI.login(credentials);
            console.log("[Auth] Login response:", response);

            if (!response.token) {
                throw new Error("No token received from server");
            }

            // Store token in cookie with improved options
            Cookies.set("auth_token", response.token, getCookieOptions());

            // Store login time for session management
            Cookies.set("login_time", new Date().toISOString(), getCookieOptions());

            console.log("[Auth] Token stored, setting user...");
            setUser(response.user);

            console.log("[Auth] Login completed successfully");
        } catch (error: any) {
            console.error("[Auth] Login error:", error);
            throw error; // Re-throw to let the component handle the error display
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterData) => {
        try {
            setIsLoading(true);
            console.log("[Auth] Attempting registration...");

            const response = await authAPI.register(data);
            console.log("[Auth] Registration response:", response);

            // Auto-login after successful registration
            await login({ username: data.username, password: data.password });
        } catch (error: any) {
            console.error("[Auth] Registration error:", error);
            throw error; // Re-throw to let the component handle the error display
        } finally {
            setIsLoading(false);
        }
    };

    const logout = useCallback(() => {
        console.log("[Auth] Logging out...");

        clearAuthData();

        // Optional: Redirect to home page
        if (typeof window !== "undefined") {
            // Use replace to prevent back button issues
            window.location.replace("/");
        }
    }, []);

    const value: AuthContextType = {
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user && isInitialized,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
