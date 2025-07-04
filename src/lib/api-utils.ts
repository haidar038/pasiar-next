/*
================================================================================
File: API Utilities
Lokasi: src/lib/api-utils.ts
Deskripsi: Utilities untuk optimasi API endpoints, caching, dan performance
================================================================================
*/

import { NextResponse } from "next/server";

// Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message: string;
    code?: string;
    timestamp: string;
    errors?: string[];
}

export interface LogContext {
    userId?: string | null;
    postId?: string | null;
    cptSlug?: string | null;
    action: string;
    timestamp: string;
    duration: number;
    status: "success" | "error";
    error?: string | null;
    method?: string;
    endpoint?: string;
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, number[]>();
const cachingStore = new Map<string, { data: any; expiry: number }>();

/**
 * Enhanced rate limiting with different limits per endpoint
 */
export class RateLimiter {
    private static limits = {
        default: { requests: 60, window: 60000 }, // 60 requests per minute
        create: { requests: 10, window: 60000 }, // 10 creates per minute
        update: { requests: 20, window: 60000 }, // 20 updates per minute
        delete: { requests: 5, window: 60000 }, // 5 deletes per minute
        auth: { requests: 5, window: 300000 }, // 5 auth attempts per 5 minutes
    };

    static check(userId: string, action: keyof typeof RateLimiter.limits = "default"): boolean {
        const now = Date.now();
        const limit = RateLimiter.limits[action];
        const key = `${userId}:${action}`;

        const userRequests = rateLimitStore.get(key) || [];

        // Remove expired requests
        const validRequests = userRequests.filter((time) => now - time < limit.window);

        if (validRequests.length >= limit.requests) {
            return false;
        }

        validRequests.push(now);
        rateLimitStore.set(key, validRequests);
        return true;
    }

    static getRemainingRequests(userId: string, action: keyof typeof RateLimiter.limits = "default"): number {
        const now = Date.now();
        const limit = RateLimiter.limits[action];
        const key = `${userId}:${action}`;

        const userRequests = rateLimitStore.get(key) || [];
        const validRequests = userRequests.filter((time) => now - time < limit.window);

        return Math.max(0, limit.requests - validRequests.length);
    }
}

/**
 * Simple in-memory caching (in production, use Redis)
 */
export class ApiCache {
    static set(key: string, data: any, ttlMs: number = 300000): void {
        // 5 minutes default
        cachingStore.set(key, {
            data,
            expiry: Date.now() + ttlMs,
        });
    }

    static get(key: string): any | null {
        const cached = cachingStore.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expiry) {
            cachingStore.delete(key);
            return null;
        }

        return cached.data;
    }

    static delete(key: string): void {
        cachingStore.delete(key);
    }

    static clear(): void {
        cachingStore.clear();
    }

    static generateKey(prefix: string, ...parts: (string | number)[]): string {
        return `${prefix}:${parts.join(":")}`;
    }
}

/**
 * Request validation utilities
 */
export class RequestValidator {
    static validateJson(body: any): { isValid: boolean; error?: string } {
        try {
            if (typeof body !== "object" || body === null) {
                return { isValid: false, error: "Request body must be a valid JSON object" };
            }
            return { isValid: true };
        } catch (error) {
            return { isValid: false, error: "Invalid JSON format" };
        }
    }

    static validateRequiredFields(data: any, requiredFields: string[]): { isValid: boolean; missingFields?: string[] } {
        const missingFields = requiredFields.filter((field) => data[field] === undefined || data[field] === null || (typeof data[field] === "string" && data[field].trim() === ""));

        return {
            isValid: missingFields.length === 0,
            missingFields: missingFields.length > 0 ? missingFields : undefined,
        };
    }

    static sanitizeString(input: string): string {
        return input
            .trim()
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<[^>]*>/g, "");
    }

    static validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateSlug(slug: string): boolean {
        const slugRegex = /^[a-z0-9_-]+$/;
        return slugRegex.test(slug);
    }
}

/**
 * Response utilities
 */
export class ApiResponseBuilder {
    static success<T>(data: T, message: string = "Success", code?: string): NextResponse<ApiResponse<T>> {
        return NextResponse.json({
            success: true,
            data,
            message,
            code,
            timestamp: new Date().toISOString(),
        });
    }

    static error(message: string, status: number = 500, code?: string, errors?: string[]): NextResponse<ApiResponse> {
        return NextResponse.json(
            {
                success: false,
                message,
                code,
                errors,
                timestamp: new Date().toISOString(),
            },
            { status }
        );
    }

    static validationError(errors: string[]): NextResponse<ApiResponse> {
        return this.error("Validation failed", 400, "VALIDATION_ERROR", errors);
    }

    static unauthorizedError(message: string = "Unauthorized"): NextResponse<ApiResponse> {
        return this.error(message, 401, "UNAUTHORIZED");
    }

    static forbiddenError(message: string = "Forbidden"): NextResponse<ApiResponse> {
        return this.error(message, 403, "FORBIDDEN");
    }

    static notFoundError(message: string = "Not found"): NextResponse<ApiResponse> {
        return this.error(message, 404, "NOT_FOUND");
    }

    static rateLimitError(): NextResponse<ApiResponse> {
        return this.error("Too many requests. Please try again later.", 429, "RATE_LIMIT_EXCEEDED");
    }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
    private startTime: number;
    private context: LogContext;

    constructor(action: string, additionalContext: Partial<LogContext> = {}) {
        this.startTime = Date.now();
        this.context = {
            action,
            timestamp: new Date().toISOString(),
            duration: 0,
            status: "error",
            ...additionalContext,
        };
    }

    success(data?: any): void {
        this.context.status = "success";
        this.context.duration = Date.now() - this.startTime;
        console.log(`[API_SUCCESS]`, this.context);
    }

    error(error: string | Error): void {
        this.context.status = "error";
        this.context.error = error instanceof Error ? error.message : error;
        this.context.duration = Date.now() - this.startTime;
        console.error(`[API_ERROR]`, this.context);
    }

    updateContext(updates: Partial<LogContext>): void {
        this.context = { ...this.context, ...updates };
    }
}

/**
 * WordPress API optimization utilities
 */
export class WordPressApiOptimizer {
    private static tokenCache: { token: string; expiry: number } | null = null;

    static async getOptimizedToken(): Promise<string | null> {
        // Return cached token if still valid
        if (this.tokenCache && Date.now() < this.tokenCache.expiry) {
            return this.tokenCache.token;
        }

        // Import here to avoid circular dependency
        const { getWordPressToken } = await import("@/lib/wordpress");
        const token = await getWordPressToken();

        if (token) {
            // Cache token for 55 minutes (assuming 1 hour expiry)
            this.tokenCache = {
                token,
                expiry: Date.now() + 55 * 60 * 1000,
            };
        }

        return token;
    }

    static clearTokenCache(): void {
        this.tokenCache = null;
    }

    static buildOptimizedQuery(params: { fields?: string[]; status?: string[]; perPage?: number; page?: number; search?: string; orderBy?: string; order?: "asc" | "desc" }): string {
        const queryParams = new URLSearchParams();

        if (params.fields && params.fields.length > 0) {
            queryParams.append("_fields", params.fields.join(","));
        }

        if (params.status && params.status.length > 0) {
            queryParams.append("status", params.status.join(","));
        }

        if (params.perPage) {
            queryParams.append("per_page", params.perPage.toString());
        }

        if (params.page) {
            queryParams.append("page", params.page.toString());
        }

        if (params.search) {
            queryParams.append("search", params.search);
        }

        if (params.orderBy) {
            queryParams.append("orderby", params.orderBy);
        }

        if (params.order) {
            queryParams.append("order", params.order);
        }

        return queryParams.toString();
    }
}

/**
 * Database connection pool for Supabase (if needed)
 */
export class DatabaseOptimizer {
    private static connectionPool: Map<string, any> = new Map();

    static async executeWithRetry<T>(operation: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> {
        let lastError: Error;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);

                if (attempt < maxRetries) {
                    await new Promise((resolve) => setTimeout(resolve, delay * attempt));
                }
            }
        }

        throw lastError!;
    }
}

/**
 * Health check utilities
 */
export class HealthChecker {
    static async checkWordPressConnection(): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
        const start = Date.now();

        try {
            const response = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/types`, {
                method: "HEAD",
                cache: "no-cache",
            });

            return {
                healthy: response.ok,
                responseTime: Date.now() - start,
                error: response.ok ? undefined : `HTTP ${response.status}`,
            };
        } catch (error) {
            return {
                healthy: false,
                responseTime: Date.now() - start,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    static async checkSupabaseConnection(): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
        const start = Date.now();

        try {
            const { supabase } = await import("@/lib/supabaseClient");
            const { error } = await supabase.from("_health_check").select("*").limit(1);

            return {
                healthy: !error,
                responseTime: Date.now() - start,
                error: error?.message,
            };
        } catch (error) {
            return {
                healthy: false,
                responseTime: Date.now() - start,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
}

export { rateLimitStore, cachingStore };
