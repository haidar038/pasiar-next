"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { authAPI } from "@/lib/api";
import { User, LoginCredentials, RegisterData } from "@/types/auth";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuthStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            // The browser automatically sends the HttpOnly cookie.
            // Our /api/me route validates it and returns the user.
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
        } catch (error) {
            // If it fails (e.g., 401), it means no valid session.
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    const login = async (credentials: LoginCredentials) => {
        try {
            setIsLoading(true);
            // Call the /api/login endpoint. It sets the HttpOnly cookie.
            const { user } = await authAPI.login(credentials);
            setUser(user);
        } catch (error: any) {
            console.error("[Auth] Login error:", error);
            setUser(null);
            throw error; // Re-throw for the form to handle
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterData) => {
        try {
            setIsLoading(true);
            // First, register the user via the direct WP endpoint
            await authAPI.register(data);
            // Then, log them in to create the session
            await login({ username: data.username, password: data.password });
        } catch (error: any) {
            console.error("[Auth] Registration error:", error);
            throw error; // Re-throw for the form to handle
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Call the /api/logout endpoint to clear the cookie
            await authAPI.logout();
            setUser(null);
        } catch (error) {
            console.error("[Auth] Logout error:", error);
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !isLoading && !!user,
        login,
        register,
        logout,
        refreshUser: checkAuthStatus,
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
