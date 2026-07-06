import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Car, Clock, CreditCard, MapPin } from "lucide-react";

export default async function CustomerDashboard() {
  const session = await auth();
  if (!session || session.user?.role !== "CUSTOMER") {
    redirect("/login");
  }

  // Fetch customer's bookings
  const bookings = await prisma.booking.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: true,
      driver: true,
    },
  });

  const activeBookings = bookings.filter(b => b.status === "STARTED" || b.status === "CONFIRMED");
  const pendingRequests = bookings.filter(b => b.status === "PENDING" || b.status === "PRICE_SENT");
  const pastBookings = bookings.filter(b => b.status === "COMPLETED" || b.status === "CANCELLED");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500 mt-2">Manage your trips, requests, and invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Trips</CardTitle>
            <Car className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{activeBookings.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{pendingRequests.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Past Trips</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{pastBookings.length}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Bookings & Requests</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <Card key={booking.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${
                      booking.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'PRICE_SENT' ? 'bg-amber-100 text-amber-800' :
                      booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                      booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status.replace("_", " ")}
                    </span>
                    <h3 className="font-semibold text-lg">{booking.tripType}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Fare</p>
                    <p className="font-bold text-gray-900">{booking.totalFare ? `₹${booking.totalFare}` : 'TBD'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{booking.pickupAddress}</p>
                      <p className="text-gray-500">to {booking.dropAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-600">
                      {booking.pickupDate ? formatDateTime(booking.pickupDate) : 'Date TBD'}
                    </span>
                  </div>
                </div>

                {booking.status === "PRICE_SENT" && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                      Accept Quote & Confirm
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
            <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>You have no trips or requests yet.</p>
            <button className="mt-4 text-amber-600 font-medium hover:underline">
              Book your first ride
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
