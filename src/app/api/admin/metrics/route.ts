import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { ApiCache } from "@/lib/api-utils";
import { HealthMonitor } from "@/lib/error-handler";
import ErrorHandler, { AuthenticationError, AuthorizationError, Logger } from "@/lib/error-handler";

export const GET = ErrorHandler.wrap(async (request: Request) => {
    // Check cache first
    const cacheKey = "admin:metrics";
    const cached = ApiCache.get(cacheKey);
    if (cached) {
        return NextResponse.json(cached);
    }

    // Authentication check
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
        throw new AuthenticationError("Authorization token required");
    }

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
        throw new AuthenticationError("Invalid authentication token");
    }

    // Check if user is admin (you may need to implement role checking)
    // For now, we'll assume any authenticated user can view metrics
    Logger.info("Admin metrics requested", { userId: user.id });

    try {
        // Get error statistics
        const errorStats = HealthMonitor.getErrorStats();
        const last24Hours = HealthMonitor.getErrorStats(86400000); // 24 hours

        // Get system metrics
        const systemMetrics = {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
        };

        // Get API performance metrics (if you have them stored)
        // This would typically come from a proper monitoring system
        const apiMetrics = {
            averageResponseTime: 250, // placeholder
            totalRequests: 1500, // placeholder
            successRate: 96.5, // placeholder
            activeConnections: 45, // placeholder
        };

        const metrics = {
            system: systemMetrics,
            errors: {
                lastHour: errorStats,
                last24Hours: last24Hours,
                overallHealth: HealthMonitor.isHealthy(),
            },
            api: apiMetrics,
            health: {
                status: HealthMonitor.isHealthy() ? "healthy" : "degraded",
            },
        };

        // Cache for 5 minutes
        ApiCache.set(cacheKey, metrics, 300000);

        Logger.info("Admin metrics retrieved successfully", {
            userId: user.id,
            errorCount: errorStats.total,
            systemHealth: metrics.health.status,
        });

        return NextResponse.json({
            success: true,
            data: metrics,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        Logger.error("Failed to retrieve admin metrics", error as Error, {
            userId: user.id,
        });
        throw error;
    }
});
