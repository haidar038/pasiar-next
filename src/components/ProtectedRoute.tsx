"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
    showLoadingSpinner?: boolean;
}

export default function ProtectedRoute({ children, redirectTo = "/login", showLoadingSpinner = true }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        // Wait for auth context to initialize
        if (!isLoading) {
            if (!isAuthenticated && !isRedirecting) {
                console.log("[ProtectedRoute] User not authenticated, redirecting to:", redirectTo);
                setIsRedirecting(true);
                router.replace(redirectTo);
            }
        }
    }, [isAuthenticated, isLoading, router, redirectTo, isRedirecting]);

    // Show loading state while checking authentication
    if (isLoading || isRedirecting) {
        if (!showLoadingSpinner) {
            return null;
        }

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <h2 className="mt-4 text-xl font-medium text-gray-900">{isRedirecting ? "Redirecting..." : "Loading..."}</h2>
                        <p className="mt-2 text-sm text-gray-600">{isRedirecting ? "Taking you to the login page" : "Please wait while we verify your access"}</p>
                    </div>
                </div>
            </div>
        );
    }

    // If not authenticated, don't render children (will redirect)
    if (!isAuthenticated || !user) {
        return null;
    }

    // User is authenticated, render the protected content
    return <>{children}</>;
}

// Higher-order component version for easier usage
export function withProtectedRoute<T extends object>(
    Component: React.ComponentType<T>,
    options?: {
        redirectTo?: string;
        showLoadingSpinner?: boolean;
    }
) {
    return function ProtectedComponent(props: T) {
        return (
            <ProtectedRoute redirectTo={options?.redirectTo} showLoadingSpinner={options?.showLoadingSpinner}>
                <Component {...props} />
            </ProtectedRoute>
        );
    };
}
