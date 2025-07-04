import { NextResponse } from "next/server";
import { HealthChecker } from "@/lib/api-utils";
import { HealthMonitor } from "@/lib/error-handler";
import { Logger } from "@/lib/error-handler";

export async function GET() {
    const startTime = Date.now();

    try {
        // Check individual services
        const [wordpressHealth, supabaseHealth] = await Promise.all([HealthChecker.checkWordPressConnection(), HealthChecker.checkSupabaseConnection()]);

        // Get error statistics
        const errorStats = HealthMonitor.getErrorStats();
        const isOverallHealthy = HealthMonitor.isHealthy() && wordpressHealth.healthy && supabaseHealth.healthy;

        const healthData = {
            status: isOverallHealthy ? "healthy" : "unhealthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            responseTime: Date.now() - startTime,
            services: {
                wordpress: {
                    status: wordpressHealth.healthy ? "up" : "down",
                    responseTime: wordpressHealth.responseTime,
                    error: wordpressHealth.error,
                },
                supabase: {
                    status: supabaseHealth.healthy ? "up" : "down",
                    responseTime: supabaseHealth.responseTime,
                    error: supabaseHealth.error,
                },
            },
            errors: {
                last_hour: errorStats,
                overall_healthy: HealthMonitor.isHealthy(),
            },
            environment: process.env.NODE_ENV,
        };

        // Log health check
        Logger.info("Health check completed", {
            status: healthData.status,
            responseTime: healthData.responseTime,
            services: Object.entries(healthData.services).map(([name, service]) => ({
                name,
                status: service.status,
            })),
        });

        return NextResponse.json(healthData, {
            status: isOverallHealthy ? 200 : 503,
        });
    } catch (error) {
        Logger.error("Health check failed", error as Error);

        return NextResponse.json(
            {
                status: "error",
                timestamp: new Date().toISOString(),
                message: "Health check failed",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
