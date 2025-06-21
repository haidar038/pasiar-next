"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function UserProfile() {
    const { user, logout, isAuthenticated } = useAuth();

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Welcome, {user.displayName}!</h2>

            <div className="space-y-2 mb-4">
                <p>
                    <strong>Username:</strong> {user.username}
                </p>
                <p>
                    <strong>Email:</strong> {user.email}
                </p>
                <p>
                    <strong>ID:</strong> {user.id}
                </p>
            </div>

            <button onClick={logout} className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Logout
            </button>
        </div>
    );
}
