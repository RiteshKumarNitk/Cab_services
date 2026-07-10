"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-4">
      <div className="text-center max-w-md">
        <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-12 w-12 text-red-700" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-8">An unexpected error occurred. Please try again or contact support.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="inline-flex items-center px-6 py-3 bg-red-700 text-white rounded-xl hover:bg-red-800 transition-colors font-medium">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </button>
          <Link href="/" className="inline-flex items-center px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
            <Home className="h-4 w-4 mr-2" /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
