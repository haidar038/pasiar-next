"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();

    const handleRefresh = async () => {
        try {
            await refreshUser();
        } catch (error) {
            console.error("Failed to refresh user data:", error);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-100">
                <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                                <button onClick={handleRefresh} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    Refresh
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-2xl font-medium">{user?.displayName?.charAt(0) || user?.username?.charAt(0) || "U"}</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">{user?.displayName || user?.username}</h2>
                                        <p className="text-gray-600">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{user?.username}</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{user?.email}</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{user?.firstName || "Not provided"}</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{user?.lastName || "Not provided"}</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{user?.id}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
