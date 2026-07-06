export default function ServicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Our Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-blue-700">One-Way Drops</h2>
          <p className="text-gray-600">Reliable and comfortable one-way trips across cities with professional drivers.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Round Trips</h2>
          <p className="text-gray-600">Book cars for round trips and vacations. Enjoy flexible timings and unlimited stops.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Airport Transfers</h2>
          <p className="text-gray-600">Punctual pickups and drops to airports with flight tracking for zero delays.</p>
        </div>
      </div>
    </div>
  );
}
