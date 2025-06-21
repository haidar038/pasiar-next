"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

    // Check auth status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Auto-refresh user data every 30 minutes
    useEffect(() => {
        if (user) {
            const interval = setInterval(() => {
                refreshUser();
            }, 30 * 60 * 1000); // 30 minutes

            return () => clearInterval(interval);
        }
    }, [user]);

    const checkAuthStatus = async () => {
        try {
            const token = Cookies.get("auth_token");
            console.log("[Auth] Checking token:", token ? "Token exists" : "No token");

            if (!token) {
                setIsLoading(false);
                return;
            }

            const userData = await authAPI.validateToken();
            console.log("[Auth] Token validation result:", userData);

            if (userData) {
                setUser(userData);
                console.log("[Auth] User set successfully:", userData);
            } else {
                // Token is invalid, remove it
                console.log("[Auth] Token invalid, removing...");
                Cookies.remove("auth_token");
                setUser(null);
            }
        } catch (error) {
            console.error("[Auth] Auth check failed:", error);
            Cookies.remove("auth_token");
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        try {
            const token = Cookies.get("auth_token");
            if (!token) return;

            const userData = await authAPI.validateToken();
            if (userData) {
                setUser(userData);
                console.log("[Auth] User refreshed:", userData);
            } else {
                logout();
            }
        } catch (error) {
            console.error("[Auth] User refresh failed:", error);
            logout();
        }
    };

    const login = async (credentials: LoginCredentials) => {
        try {
            setIsLoading(true);
            console.log("[Auth] Attempting login...");

            const response = await authAPI.login(credentials);
            console.log("[Auth] Login response:", response);

            // Store token in secure cookie
            Cookies.set("auth_token", response.token, {
                expires: 7, // 7 days
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
            });

            console.log("[Auth] Token stored, setting user...");
            setUser(response.user);

            // Optional: Store login time for session management
            Cookies.set("login_time", new Date().toISOString(), {
                expires: 7,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
            });

            console.log("[Auth] Login completed successfully");
        } catch (error: any) {
            console.error("[Auth] Login error:", error);
            const errorMessage = error.response?.data?.message || error.response?.data?.data?.message || "Login failed";
            throw new Error(errorMessage);
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

            // Auto-login after registration
            await login({ username: data.username, password: data.password });
        } catch (error: any) {
            console.error("[Auth] Registration error:", error);
            const errorMessage = error.response?.data?.message || error.response?.data?.data?.message || "Registration failed";
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        console.log("[Auth] Logging out...");

        // Remove all auth-related cookies
        Cookies.remove("auth_token", { path: "/" });
        Cookies.remove("login_time", { path: "/" });
        setUser(null);

        // Optional: Redirect to home page
        if (typeof window !== "undefined") {
            window.location.href = "/";
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
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
