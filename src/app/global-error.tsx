"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Critical Error</h1>
            <p className="text-gray-500 mb-6">A critical error occurred. Please refresh the page.</p>
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-red-700 text-white rounded-xl hover:bg-red-800 font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
