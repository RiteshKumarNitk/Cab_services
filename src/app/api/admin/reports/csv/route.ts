import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { STAFF_ROLES, hasRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { generateCsv } from "@/lib/csv-export";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  // Exports contain customer PII and financials: back-office staff only (not content editors).
  if (!hasRole(session.user?.role, STAFF_ROLES.filter((r) => r !== "CONTENT_MANAGER"))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const formData = await req.formData();
  const type = formData.get("type") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const source = formData.get("source") as string | null;
  const status = formData.get("status") as string | null;

  const start = startDate ? new Date(startDate + "T00:00:00.000Z") : new Date(0);
  const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date();

  const dateFilter = { createdAt: { gte: start, lte: end } };

  let rows: Record<string, unknown>[] = [];
  let filename = "report.csv";

  switch (type) {
    case "crm": {
      const where = { ...dateFilter, ...(source ? { source } : {}) };
      const leads = await prisma.lead.findMany({
        where,
        select: {
          leadNumber: true,
          name: true,
          email: true,
          phone: true,
          source: true,
          status: true,
          city: true,
          createdAt: true,
          convertedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      rows = leads.map((l) => ({
        "Lead #": l.leadNumber,
        Name: l.name,
        Email: l.email ?? "",
        Phone: l.phone ?? "",
        Source: l.source,
        Status: l.status,
        City: l.city ?? "",
        Created: l.createdAt.toISOString().split("T")[0],
        Converted: l.convertedAt ? l.convertedAt.toISOString().split("T")[0] : "",
      }));
      filename = "crm-leads.csv";
      break;
    }
    case "sales": {
      const quotations = await prisma.quotation.findMany({
        where: dateFilter,
        select: {
          quotationNumber: true,
          status: true,
          vehicleType: true,
          bookingType: true,
          totalFare: true,
          baseFare: true,
          gst: true,
          discount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      rows = quotations.map((q) => ({
        "Quote #": q.quotationNumber,
        Status: q.status,
        "Vehicle Type": q.vehicleType ?? "",
        "Booking Type": q.bookingType,
        "Base Fare": q.baseFare ?? 0,
        GST: q.gst ?? 0,
        Discount: q.discount ?? 0,
        "Total Fare": q.totalFare ?? 0,
        Created: q.createdAt.toISOString().split("T")[0],
      }));
      filename = "sales-quotations.csv";
      break;
    }
    case "bookings": {
      const bookingWhere = { ...dateFilter, ...(status ? { status: status as any } : {}) } as any;
      const bookings = await prisma.booking.findMany({
        where: bookingWhere,
        include: {
          customer: { select: { name: true } },
          vehicle: { select: { plateNumber: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      rows = bookings.map((b: any) => ({
        "Booking #": b.bookingNumber,
        Customer: b.customer?.name ?? "",
        Status: b.status,
        Type: b.bookingType,
        "Total Fare": b.totalFare ?? b.fare,
        Vehicle: b.vehicle ? `${b.vehicle.name} (${b.vehicle.plateNumber})` : "",
        Created: b.createdAt.toISOString().split("T")[0],
      }));
      filename = "bookings.csv";
      break;
    }
    case "trips": {
      const trips = await prisma.trip.findMany({
        where: dateFilter,
        select: {
          tripNumber: true,
          status: true,
          actualDistance: true,
          actualPickupTime: true,
          actualDropTime: true,
          booking: { select: { bookingNumber: true, distance: true, duration: true } },
          vehicle: { select: { plateNumber: true, type: true } },
          driver: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      rows = trips.map((t) => ({
        "Trip #": t.tripNumber,
        "Booking #": t.booking.bookingNumber,
        Status: t.status,
        Driver: t.driver?.name ?? "",
        Vehicle: t.vehicle ? `${t.vehicle.plateNumber} (${t.vehicle.type})` : "",
        Distance: t.actualDistance ?? t.booking.distance ?? 0,
        Duration: t.booking.duration ?? 0,
        "Pickup Time": t.actualPickupTime?.toISOString() ?? "",
        "Drop Time": t.actualDropTime?.toISOString() ?? "",
        Created: t.createdAt.toISOString().split("T")[0],
      }));
      filename = "trips.csv";
      break;
    }
    case "fleet": {
      const vehicles = await prisma.vehicle.findMany({
        select: {
          plateNumber: true,
          name: true,
          model: true,
          type: true,
          status: true,
          fuelType: true,
          seats: true,
          pricePerKm: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      rows = vehicles.map((v) => ({
        Plate: v.plateNumber,
        Name: v.name,
        Model: v.model,
        Type: v.type,
        Status: v.status,
        Fuel: v.fuelType,
        Seats: v.seats,
        "Price/Km": v.pricePerKm,
        Created: v.createdAt.toISOString().split("T")[0],
      }));
      filename = "fleet.csv";
      break;
    }
    case "drivers": {
      const drivers = await prisma.user.findMany({
        where: { role: "DRIVER" },
        select: {
          name: true,
          email: true,
          phone: true,
          isActive: true,
          driverStatus: { select: { online: true } },
          ratingsReceived: { select: { score: true } },
          _count: { select: { bookingsAsDriver: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      rows = drivers.map((d) => ({
        Name: d.name,
        Email: d.email,
        Phone: d.phone ?? "",
        Active: d.isActive ? "Yes" : "No",
        Online: d.driverStatus?.online ? "Yes" : "No",
        Trips: d._count.bookingsAsDriver,
        "Avg Rating": d.ratingsReceived.length
          ? (d.ratingsReceived.reduce((s, r) => s + r.score, 0) / d.ratingsReceived.length).toFixed(1)
          : "N/A",
        Joined: d.createdAt.toISOString().split("T")[0],
      }));
      filename = "drivers.csv";
      break;
    }
    case "finance": {
      const invoices = await prisma.invoice.findMany({
        where: dateFilter,
        select: {
          invoiceNumber: true,
          status: true,
          total: true,
          paidAmount: true,
          gst: true,
          discount: true,
          paymentMethod: true,
          paymentStatus: true,
          dueDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      rows = invoices.map((i) => ({
        "Invoice #": i.invoiceNumber,
        Status: i.status,
        Total: i.total,
        Paid: i.paidAmount,
        GST: i.gst,
        Discount: i.discount,
        "Payment Method": i.paymentMethod ?? "",
        "Payment Status": i.paymentStatus,
        "Due Date": i.dueDate?.toISOString().split("T")[0] ?? "",
        Created: i.createdAt.toISOString().split("T")[0],
      }));
      filename = "finance.csv";
      break;
    }
    case "customers": {
      const customers = await prisma.user.findMany({
        where: { role: "CUSTOMER", ...dateFilter } as any,
        include: {
          _count: { select: { bookingsAsCustomer: true } },
          bookingsAsCustomer: { select: { totalFare: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      rows = customers.map((c: any) => ({
        Name: c.name,
        Email: c.email,
        Phone: c.phone ?? "",
        Active: c.isActive ? "Yes" : "No",
        Bookings: c._count?.bookingsAsCustomer ?? 0,
        "Total Spend": (c.bookingsAsCustomer ?? []).reduce((s: number, b: any) => s + (b.totalFare ?? 0), 0),
        Joined: c.createdAt.toISOString().split("T")[0],
      }));
      filename = "customers.csv";
      break;
    }
  }

  const { csv } = generateCsv(rows, filename);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
