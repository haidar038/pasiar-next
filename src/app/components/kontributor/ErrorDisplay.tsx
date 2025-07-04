"use client";

import React from "react";

interface ErrorDisplayProps {
    error: string | string[] | null;
    onRetry?: () => void;
    onDismiss?: () => void;
    retryable?: boolean;
}

export default function ErrorDisplay({ error, onRetry, onDismiss, retryable = false }: ErrorDisplayProps) {
    if (!error) return null;

    const errorMessages = Array.isArray(error) ? error : [error];

    return (
        <div className="mb-4 p-4 border border-red-300 rounded-lg bg-red-50">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">{errorMessages.length === 1 ? "Terjadi kesalahan:" : "Terjadi beberapa kesalahan:"}</h3>
                    <div className="mt-2 text-sm text-red-700">
                        {errorMessages.length === 1 ? (
                            <p>{errorMessages[0]}</p>
                        ) : (
                            <ul className="list-disc pl-5 space-y-1">
                                {errorMessages.map((message, index) => (
                                    <li key={index}>{message}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {(retryable || onDismiss) && (
                        <div className="mt-4 flex space-x-2">
                            {retryable && onRetry && (
                                <button
                                    type="button"
                                    onClick={onRetry}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    Coba Lagi
                                </button>
                            )}
                            {onDismiss && (
                                <button
                                    type="button"
                                    onClick={onDismiss}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Tutup
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Success message component
interface SuccessDisplayProps {
    message: string | null;
    onDismiss?: () => void;
}

export function SuccessDisplay({ message, onDismiss }: SuccessDisplayProps) {
    if (!message) return null;

    return (
        <div className="mb-4 p-4 border border-green-300 rounded-lg bg-green-50">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-green-800">{message}</p>
                    {onDismiss && (
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={onDismiss}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Tutup
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Loading display component
interface LoadingDisplayProps {
    message?: string;
    size?: "sm" | "md" | "lg";
}

export function LoadingDisplay({ message = "Memuat...", size = "md" }: LoadingDisplayProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
    };

    return (
        <div className="flex items-center justify-center p-4">
            <svg className={`animate-spin ${sizeClasses[size]} text-blue-600 mr-3`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-600">{message}</span>
        </div>
    );
}
