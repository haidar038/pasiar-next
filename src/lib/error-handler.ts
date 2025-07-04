/*
================================================================================
File: Error Handler
Lokasi: src/lib/error-handler.ts
Deskripsi: Comprehensive error handling and logging system
================================================================================
*/

import { NextResponse } from "next/server";

// Error types
export enum ErrorType {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
    NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
    WORDPRESS_API_ERROR = "WORDPRESS_API_ERROR",
    SUPABASE_ERROR = "SUPABASE_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}

export interface ErrorDetails {
    type: ErrorType;
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    context?: Record<string, any>;
    stack?: string;
    retryable?: boolean;
    userMessage?: string;
}

export interface LogEntry {
    level: "error" | "warn" | "info" | "debug";
    message: string;
    error?: ErrorDetails;
    context?: Record<string, any>;
    timestamp: string;
    userId?: string;
    requestId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
}

// Custom error classes
export class AppError extends Error {
    public readonly type: ErrorType;
    public readonly statusCode: number;
    public readonly code?: string;
    public readonly context?: Record<string, any>;
    public readonly retryable: boolean;
    public readonly userMessage?: string;

    constructor(type: ErrorType, message: string, statusCode: number = 500, code?: string, context?: Record<string, any>, retryable: boolean = false, userMessage?: string) {
        super(message);
        this.name = "AppError";
        this.type = type;
        this.statusCode = statusCode;
        this.code = code;
        this.context = context;
        this.retryable = retryable;
        this.userMessage = userMessage;

        // Capture stack trace
        Error.captureStackTrace(this, AppError);
    }

    toJSON(): ErrorDetails {
        return {
            type: this.type,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            timestamp: new Date().toISOString(),
            context: this.context,
            stack: this.stack,
            retryable: this.retryable,
            userMessage: this.userMessage,
        };
    }
}

export class ValidationError extends AppError {
    constructor(message: string, fields?: string[], context?: Record<string, any>) {
        super(ErrorType.VALIDATION_ERROR, message, 400, "VALIDATION_FAILED", { ...context, invalidFields: fields }, false, "Please check your input and try again.");
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = "Authentication required", context?: Record<string, any>) {
        super(ErrorType.AUTHENTICATION_ERROR, message, 401, "AUTH_REQUIRED", context, false, "Please log in to continue.");
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = "Insufficient permissions", context?: Record<string, any>) {
        super(ErrorType.AUTHORIZATION_ERROR, message, 403, "INSUFFICIENT_PERMISSIONS", context, false, "You do not have permission to perform this action.");
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = "Resource", id?: string, context?: Record<string, any>) {
        super(ErrorType.NOT_FOUND_ERROR, `${resource}${id ? ` with id '${id}'` : ""} not found`, 404, "NOT_FOUND", { ...context, resource, id }, false, "The requested item could not be found.");
    }
}

export class RateLimitError extends AppError {
    constructor(limit: number, window: number, context?: Record<string, any>) {
        super(
            ErrorType.RATE_LIMIT_ERROR,
            `Rate limit exceeded: ${limit} requests per ${window}ms`,
            429,
            "RATE_LIMIT_EXCEEDED",
            { ...context, limit, window },
            true,
            "Too many requests. Please try again later."
        );
    }
}

export class WordPressApiError extends AppError {
    constructor(message: string, wpStatusCode?: number, context?: Record<string, any>) {
        super(
            ErrorType.WORDPRESS_API_ERROR,
            `WordPress API Error: ${message}`,
            wpStatusCode === 404 ? 404 : 502,
            "WORDPRESS_API_ERROR",
            { ...context, wpStatusCode },
            wpStatusCode ? wpStatusCode >= 500 : true,
            "There was an issue with the content management system. Please try again."
        );
    }
}

export class SupabaseError extends AppError {
    constructor(message: string, originalError?: any, context?: Record<string, any>) {
        super(
            ErrorType.SUPABASE_ERROR,
            `Database Error: ${message}`,
            500,
            "DATABASE_ERROR",
            { ...context, originalError: originalError?.message },
            true,
            "There was a database issue. Please try again."
        );
    }
}

// Logger class
export class Logger {
    private static isDevelopment = process.env.NODE_ENV === "development";

    static log(entry: LogEntry): void {
        const logEntry = {
            ...entry,
            timestamp: new Date().toISOString(),
        };

        // Console logging
        const logMethod = console[entry.level] || console.log;

        if (this.isDevelopment) {
            // Detailed logging in development
            logMethod(`[${entry.level.toUpperCase()}]`, logEntry);
        } else {
            // Structured logging in production
            logMethod(JSON.stringify(logEntry));
        }

        // TODO: In production, send to external logging service
        // await this.sendToExternalLogger(logEntry);
    }

    static error(message: string, error?: Error | AppError, context?: Record<string, any>): void {
        this.log({
            level: "error",
            message,
            error:
                error instanceof AppError
                    ? error.toJSON()
                    : error
                    ? {
                          type: ErrorType.INTERNAL_ERROR,
                          message: error.message,
                          statusCode: 500,
                          timestamp: new Date().toISOString(),
                          stack: error.stack,
                      }
                    : undefined,
            context,
            timestamp: new Date().toISOString(),
        });
    }

    static warn(message: string, context?: Record<string, any>): void {
        this.log({
            level: "warn",
            message,
            context,
            timestamp: new Date().toISOString(),
        });
    }

    static info(message: string, context?: Record<string, any>): void {
        this.log({
            level: "info",
            message,
            context,
            timestamp: new Date().toISOString(),
        });
    }

    static debug(message: string, context?: Record<string, any>): void {
        if (this.isDevelopment) {
            this.log({
                level: "debug",
                message,
                context,
                timestamp: new Date().toISOString(),
            });
        }
    }
}

// Error handler middleware
export class ErrorHandler {
    static handle(error: unknown, request?: Request): NextResponse {
        const timestamp = new Date().toISOString();
        let appError: AppError;

        // Convert unknown errors to AppError
        if (error instanceof AppError) {
            appError = error;
        } else if (error instanceof Error) {
            appError = new AppError(ErrorType.INTERNAL_ERROR, error.message, 500, "INTERNAL_ERROR", { originalError: error.name }, false, "An unexpected error occurred. Please try again.");
        } else {
            appError = new AppError(ErrorType.INTERNAL_ERROR, "Unknown error occurred", 500, "UNKNOWN_ERROR", { error: String(error) }, false, "An unexpected error occurred. Please try again.");
        }

        // Log the error
        Logger.error(`API Error: ${appError.message}`, appError, {
            endpoint: request ? new URL(request.url).pathname : undefined,
            method: request?.method,
            userAgent: request?.headers.get("user-agent"),
            ip: request?.headers.get("x-forwarded-for") || request?.headers.get("x-real-ip") || "unknown",
        });

        // Return appropriate response
        return NextResponse.json(
            {
                success: false,
                message: appError.userMessage || appError.message,
                code: appError.code,
                type: appError.type,
                timestamp,
                retryable: appError.retryable,
                // Include stack trace only in development
                ...(process.env.NODE_ENV === "development" && {
                    stack: appError.stack,
                    context: appError.context,
                }),
            },
            { status: appError.statusCode }
        );
    }

    static async handleAsync<T>(operation: () => Promise<T>, request?: Request): Promise<T | NextResponse> {
        try {
            return await operation();
        } catch (error) {
            return this.handle(error, request);
        }
    }

    static wrap(handler: (request: Request) => Promise<NextResponse>) {
        return async (request: Request): Promise<NextResponse> => {
            try {
                return await handler(request);
            } catch (error) {
                return this.handle(error, request);
            }
        };
    }
}

// Health check and monitoring
export class HealthMonitor {
    private static errors: ErrorDetails[] = [];
    private static maxErrors = 1000;

    static recordError(error: ErrorDetails): void {
        this.errors.unshift(error);
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }
    }

    static getErrorStats(timeWindow: number = 3600000): {
        total: number;
        byType: Record<string, number>;
        retryableErrors: number;
        criticalErrors: number;
    } {
        const cutoff = Date.now() - timeWindow;
        const recentErrors = this.errors.filter((error) => new Date(error.timestamp).getTime() > cutoff);

        const byType: Record<string, number> = {};
        let retryableErrors = 0;
        let criticalErrors = 0;

        for (const error of recentErrors) {
            byType[error.type] = (byType[error.type] || 0) + 1;
            if (error.retryable) retryableErrors++;
            if (error.statusCode >= 500) criticalErrors++;
        }

        return {
            total: recentErrors.length,
            byType,
            retryableErrors,
            criticalErrors,
        };
    }

    static isHealthy(): boolean {
        const stats = this.getErrorStats();
        return stats.criticalErrors < 10 && stats.total < 100;
    }
}

// Utility functions
export function createErrorFromWordPressResponse(response: Response, data?: any): WordPressApiError {
    const message = data?.message || data?.code || `HTTP ${response.status}`;
    return new WordPressApiError(message, response.status, { responseData: data });
}

export function createErrorFromSupabaseError(error: any): SupabaseError {
    return new SupabaseError(error.message || "Database operation failed", error, {
        code: error.code,
        details: error.details,
    });
}

export function isRetryableError(error: Error | AppError): boolean {
    if (error instanceof AppError) {
        return error.retryable;
    }

    // Network errors are generally retryable
    return error.name === "TypeError" && error.message.includes("fetch");
}

export { ErrorHandler as default };
