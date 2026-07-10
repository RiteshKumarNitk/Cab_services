import { Car } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-100 border-t-red-700 mx-auto mb-4" />
          <Car className="h-6 w-6 text-red-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}
