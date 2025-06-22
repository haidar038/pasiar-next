"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function UserProfile() {
    const { user, logout, refreshUser, isAuthenticated, isLoading } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    if (!isAuthenticated || !user) {
        // Show a loading skeleton or null while auth is loading
        return isLoading ? <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow animate-pulse"></div> : null;
    }

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshUser();
        } catch (error) {
            console.error("Failed to refresh user:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Welcome, {user.displayName}!</h2>
                <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50" title="Refresh user data">
                    {isRefreshing ? (
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
                        </svg>
                    )}
                </button>
            </div>

            <div className="space-y-3 mb-6 text-gray-700">
                <p>
                    <strong>ID:</strong> {user.id}
                </p>
                <p>
                    <strong>Username:</strong> {user.username}
                </p>
                <p>
                    <strong>Email:</strong> {user.email}
                </p>
                <p>
                    <strong>First Name:</strong> {user.firstName || "Not set"}
                </p>
                <p>
                    <strong>Last Name:</strong> {user.lastName || "Not set"}
                </p>
            </div>

            <button onClick={logout} className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Logout
            </button>
        </div>
    );
}
