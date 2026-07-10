"use client";

import Link from "next/link";
import { Car, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-4">
      <div className="text-center max-w-md">
        <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <Car className="h-12 w-12 text-red-700" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-xl text-gray-600 mb-6">Page not found</p>
        <p className="text-gray-500 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="inline-flex items-center px-6 py-3 bg-red-700 text-white rounded-xl hover:bg-red-800 transition-colors font-medium">
            <Home className="h-4 w-4 mr-2" /> Go Home
          </Link>
          <button onClick={() => router.back()} className="inline-flex items-center px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
