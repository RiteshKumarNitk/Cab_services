import { PrismaClient, type Role, type User, type VehicleType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes, randomInt } from "node:crypto";

// Seed: business content (website settings, CMS, fleet, pricing) plus an Indian demo dataset
// (staff for every role, drivers, customers and bookings across the whole lifecycle).
//
// Safe to re-run: content is upserted, accounts are created only if missing (existing
// passwords are never reset), and the demo pipeline is skipped once its marker lead exists.
//
// Passwords are random per account and printed ONCE at the end of the run, never stored in
// the repo. Set SEED_PASSWORD to use one known password for all NEW accounts (local dev only).
//
// Demo records use "DEMO" numbers (LD-DEMO-*, BK-DEMO-*, ...) and @aradhana.example /
// @example.com addresses so they are easy to recognise and remove.

const prisma = new PrismaClient();

const DEMO_MARKER_LEAD = "LD-DEMO-001";
const day = 86_400_000;

/** Date `days` from today at hh:mm local time. */
function at(days: number, hh = 10, mm = 0): Date {
  const d = new Date(Date.now() + days * day);
  d.setHours(hh, mm, 0, 0);
  return d;
}

function newPassword(): string {
  if (process.env.SEED_PASSWORD) return process.env.SEED_PASSWORD;
  // 16 chars from base64url plus a guaranteed digit and symbol.
  return `${randomBytes(12).toString("base64url")}${randomInt(10)}!`;
}

type Credential = { role: Role; name: string; email: string; phone: string; password: string };
const credentials: Credential[] = [];

async function account(input: {
  email: string; name: string; phone: string; role: Role; organizationId?: string; branchId?: string;
}): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return existing;
  const password = newPassword();
  const user = await prisma.user.create({
    data: { ...input, passwordHash: await bcrypt.hash(password, 12) },
  });
  credentials.push({ role: input.role, name: input.name, email: input.email, phone: input.phone, password });
  return user;
}

/** Fare breakdown in INR (5% GST, as configured on the pricing page). */
function fare(km: number, perKm: number, extras: { driverAllowance?: number; toll?: number; parking?: number; permit?: number; night?: number; discount?: number } = {}) {
  const baseFare = Math.round(km * perKm);
  const driverAllowance = extras.driverAllowance ?? 0;
  const tollCharges = extras.toll ?? 0;
  const parkingCharges = extras.parking ?? 0;
  const permitCharges = extras.permit ?? 0;
  const nightCharges = extras.night ?? 0;
  const discount = extras.discount ?? 0;
  const subtotal = baseFare + driverAllowance + tollCharges + parkingCharges + permitCharges + nightCharges - discount;
  const gst = Math.round(subtotal * 0.05);
  return { baseFare, perKmCharge: perKm, totalKm: km, driverAllowance, tollCharges, parkingCharges, permitCharges, nightCharges, discount, gst, totalFare: subtotal + gst, subtotal };
}

async function main() {
  console.log("Seeding database...");

  // ====== ORGANIZATION & BRANCH ======
  const org = await prisma.organization.upsert({
    where: { slug: "aradhana-travel" },
    update: {},
    create: {
      name: "Aradhana Travel Services",
      slug: "aradhana-travel",
      logo: "",
      address: "G-3A, Rajputana Tower, Khatipura",
      city: "Jaipur",
      state: "Rajasthan",
      zipCode: "302012",
      phone: "+91 98765 43210",
      email: "info@aradhanatravel.com",
    },
  });
  console.log("Organization:", org.name);

  const branch = await prisma.branch.upsert({
    where: { slug: "jaipur-head-office" },
    update: {},
    create: {
      name: "Jaipur Head Office",
      slug: "jaipur-head-office",
      organizationId: org.id,
      address: "G-3A, Rajputana Tower, Khatipura",
      city: "Jaipur",
      state: "Rajasthan",
      zipCode: "302012",
      phone: "+91 98765 43210",
      email: "jaipur@aradhanatravel.com",
    },
  });
  console.log("Branch:", branch.name);

  await seedContent();
  const people = await seedAccounts(org.id, branch.id);
  await prisma.branch.update({ where: { id: branch.id }, data: { managerId: people.staff.admin.id } });
  const fleet = await seedOperationalFleet(people.drivers);
  await seedDemoPipeline(branch.id, people, fleet);

  console.log("\n✅ Seed completed!");
  printCredentials();
}

// =====================================================================================
// Accounts
// =====================================================================================

async function seedAccounts(organizationId: string, branchId: string) {
  const staffAccount = (email: string, name: string, phone: string, role: Role) =>
    account({ email, name, phone, role, organizationId, branchId });

  const staff = {
    superAdmin: await staffAccount("superadmin@aradhana.example", "Ritesh Kumar", "+919829000101", "SUPER_ADMIN"),
    admin: await staffAccount("admin@aradhana.example", "Anil Mathur", "+919829000102", "ADMIN"),
    opsManager: await staffAccount("ops@aradhana.example", "Deepak Joshi", "+919829000103", "BOOKING_MANAGER"),
    salesExec: await staffAccount("sales@aradhana.example", "Kavita Sharma", "+919829000104", "SUPPORT_EXECUTIVE"),
    fleetManager: await staffAccount("fleet@aradhana.example", "Manoj Yadav", "+919829000105", "FLEET_MANAGER"),
    driverManager: await staffAccount("drivers@aradhana.example", "Harish Choudhary", "+919829000106", "DRIVER_MANAGER"),
    finance: await staffAccount("finance@aradhana.example", "Pooja Jain", "+919829000107", "FINANCE"),
    content: await staffAccount("content@aradhana.example", "Neha Kapoor", "+919829000108", "CONTENT_MANAGER"),
  };

  const driverData = [
    { email: "suresh.kumar@aradhana.example", name: "Suresh Kumar", phone: "+919829000201", license: "RJ14 20150012345", years: 11, address: "Jhotwara, Jaipur", languages: "Hindi, Rajasthani, English" },
    { email: "ramesh.meena@aradhana.example", name: "Ramesh Meena", phone: "+919829000202", license: "RJ14 20170023456", years: 8, address: "Sanganer, Jaipur", languages: "Hindi, Rajasthani" },
    { email: "mahendra.shekhawat@aradhana.example", name: "Mahendra Singh Shekhawat", phone: "+919829000203", license: "RJ23 20120034567", years: 14, address: "Sikar Road, Jaipur", languages: "Hindi, Rajasthani, English" },
    { email: "abdul.rashid@aradhana.example", name: "Abdul Rashid", phone: "+919829000204", license: "RJ14 20160045678", years: 9, address: "Ramganj, Jaipur", languages: "Hindi, Urdu, English" },
  ];
  const drivers: User[] = [];
  for (const d of driverData) {
    const user = await account({ email: d.email, name: d.name, phone: d.phone, role: "DRIVER", organizationId, branchId });
    await prisma.driverStatus.upsert({ where: { driverId: user.id }, update: {}, create: { driverId: user.id, online: false } });
    await prisma.cabDriverProfile.upsert({
      where: { driverId: user.id },
      update: {},
      create: {
        driverId: user.id, licenseNumber: d.license, licenseExpiry: at(900), address: d.address, city: "Jaipur",
        state: "Rajasthan", zipCode: "302012", backgroundCheck: true, experienceYears: d.years, languagesSpoken: d.languages,
      },
    });
    drivers.push(user);
  }

  const customerData = [
    { email: "rajesh.sharma@example.com", name: "Rajesh Sharma", phone: "+919414000301" },
    { email: "priya.singh@example.com", name: "Priya Singh", phone: "+919414000302" },
    { email: "vikram.rathore@example.com", name: "Vikram Singh Rathore", phone: "+919414000303" },
    { email: "anita.gupta@example.com", name: "Anita Gupta", phone: "+919810000304" },
    { email: "mohammed.irfan@example.com", name: "Mohammed Irfan", phone: "+919414000305" },
    { email: "sneha.agarwal@example.com", name: "Sneha Agarwal", phone: "+919414000306" },
  ];
  const customers: User[] = [];
  for (const c of customerData) customers.push(await account({ ...c, role: "CUSTOMER" }));

  console.log(`Accounts: ${Object.keys(staff).length} staff, ${drivers.length} drivers, ${customers.length} customers (${credentials.length} new)`);
  return { staff, drivers, customers };
}

// =====================================================================================
// Operational fleet (vehicles that get assigned to bookings)
// =====================================================================================

async function seedOperationalFleet(drivers: User[]) {
  const vehicles: Array<{ plateNumber: string; name: string; model: string; color: string; seats: number; luggage: number; type: VehicleType; pricePerKm: number; driverId: string; insuranceExpiry: Date }> = [
    { plateNumber: "RJ-14-XX-1001", name: "Toyota Etios", model: "Toyota Etios", color: "White", seats: 4, luggage: 2, type: "SEDAN", pricePerKm: 11, driverId: drivers[3].id, insuranceExpiry: at(240) },
    { plateNumber: "RJ-14-XX-1002", name: "Honda City", model: "Honda City", color: "Silver", seats: 4, luggage: 2, type: "SEDAN", pricePerKm: 12, driverId: drivers[1].id, insuranceExpiry: at(300) },
    { plateNumber: "RJ-14-XX-2001", name: "Toyota Innova Crysta", model: "Toyota Innova Crysta", color: "White", seats: 7, luggage: 4, type: "SUV", pricePerKm: 14, driverId: drivers[0].id, insuranceExpiry: at(180) },
    // Insurance due in 10 days: shows up in document-expiry checks.
    { plateNumber: "RJ-14-XX-2002", name: "Mahindra Scorpio", model: "Mahindra Scorpio", color: "Black", seats: 7, luggage: 4, type: "SUV", pricePerKm: 14, driverId: drivers[2].id, insuranceExpiry: at(10) },
  ];
  const byPlate: Record<string, string> = {};
  for (const v of vehicles) {
    const row = await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: {},
      create: { ...v, fitnessExpiry: at(400), permitExpiry: at(200), rcExpiry: at(1500), ac: true, fuelType: "DIESEL", transmission: "MANUAL" },
    });
    byPlate[v.plateNumber] = row.id;
  }
  console.log("Operational vehicles:", Object.keys(byPlate).join(", "));
  return {
    etios: byPlate["RJ-14-XX-1001"], city: byPlate["RJ-14-XX-1002"],
    innova: byPlate["RJ-14-XX-2001"], scorpio: byPlate["RJ-14-XX-2002"],
  };
}

// =====================================================================================
// Demo pipeline: Lead -> Quotation -> Booking -> Dispatch -> Trip -> Invoice -> Payment
// =====================================================================================

type People = Awaited<ReturnType<typeof seedAccounts>>;
type Fleet = Awaited<ReturnType<typeof seedOperationalFleet>>;

async function seedDemoPipeline(branchId: string, people: People, fleet: Fleet) {
  if (await prisma.lead.findUnique({ where: { leadNumber: DEMO_MARKER_LEAD } })) {
    console.log("Demo pipeline already present; skipping.");
    return;
  }
  const { staff, drivers, customers } = people;
  const [suresh, ramesh, mahendra, abdul] = drivers;
  const [rajesh, priya, vikram, anita, irfan, sneha] = customers;

  // ---------- Leads that have not converted yet ----------
  await prisma.lead.create({
    data: {
      leadNumber: DEMO_MARKER_LEAD, status: "NEW", source: "WEBSITE", name: "Amit Verma", email: "amit.verma@example.com",
      phone: "+919414000401", city: "Jaipur", bookingType: "OUTSTATION", tripType: "ROUND_TRIP",
      pickupAddress: "Jaipur International Airport, Sanganer", dropAddress: "City Palace, Udaipur",
      pickupDate: at(9, 7), returnDate: at(12, 18), passengers: 4, preferredVehicle: "SUV",
      notes: "Family trip to Udaipur, needs airport pickup.", branchId,
    },
  });

  const karan = await prisma.lead.create({
    data: {
      leadNumber: "LD-DEMO-002", status: "CONTACTED", source: "PHONE", name: "Karan Mehta", email: "karan.mehta@example.com",
      phone: "+919414000402", city: "Jaipur", bookingType: "OUTSTATION", tripType: "ROUND_TRIP",
      pickupAddress: "Vaishali Nagar, Jaipur", dropAddress: "Ranthambore National Park, Sawai Madhopur",
      pickupDate: at(14, 6), returnDate: at(15, 20), passengers: 5, preferredVehicle: "SUV", leadScore: 7,
      notes: "Wildlife safari weekend. Comparing prices.", assignedToId: staff.salesExec.id, branchId,
    },
  });
  await prisma.followUp.create({
    data: {
      leadId: karan.id, userId: staff.salesExec.id, type: "CALL", outcome: "INTERESTED", nextAction: "SEND_QUOTE",
      leadScore: 7, duration: 240, notes: "Wants Innova for 5 people. Will confirm dates with family.", reminderAt: at(1, 11),
    },
  });

  const snehaLead = await prisma.lead.create({
    data: {
      leadNumber: "LD-DEMO-003", status: "QUOTATION_SENT", source: "WEBSITE", name: sneha.name, email: sneha.email,
      phone: sneha.phone, city: "Jaipur", bookingType: "OUTSTATION", tripType: "ROUND_TRIP",
      pickupAddress: "Vaishali Nagar, Jaipur", dropAddress: "Brahma Temple, Pushkar", pickupDate: at(6, 8), returnDate: at(6, 21),
      passengers: 3, preferredVehicle: "SEDAN", leadScore: 8, assignedToId: staff.salesExec.id, branchId,
    },
  });
  const snehaFare = fare(300, 12, { driverAllowance: 300, toll: 260 });
  await prisma.quotation.create({
    data: {
      quotationNumber: "QT-DEMO-003", leadId: snehaLead.id, status: "SENT", validUntil: at(5), bookingType: "OUTSTATION", tripType: "ROUND_TRIP",
      pickupAddress: snehaLead.pickupAddress, dropAddress: snehaLead.dropAddress, pickupDate: snehaLead.pickupDate, returnDate: snehaLead.returnDate,
      passengers: 3, vehicleType: "SEDAN", ...omitSubtotal(snehaFare), createdById: staff.salesExec.id, branchId,
      notes: "Ajmer Sharif and Pushkar day trip, Honda City.",
    },
  });
  await prisma.followUp.create({
    data: {
      leadId: snehaLead.id, userId: staff.salesExec.id, type: "WHATSAPP", outcome: "FOLLOW_UP", nextAction: "SCHEDULE_CALL",
      leadScore: 8, notes: `Quotation QT-DEMO-003 sent on WhatsApp (₹${snehaFare.totalFare}).`, reminderAt: at(2, 12),
    },
  });

  // ---------- Converted bookings across the operations lifecycle ----------
  type Stage = {
    n: number; customer: User; source: string; bookingType: "LOCAL" | "OUTSTATION" | "AIRPORT"; tripType: "ONE_WAY" | "ROUND_TRIP";
    pickup: string; drop: string; pickupDate: Date; returnDate?: Date; passengers: number; vehicleType: VehicleType;
    f: ReturnType<typeof fare>; status: string; vehicleId?: string; driverId?: string;
  };
  const stages: Stage[] = [
    // Awaiting assignment (Dispatch board: Awaiting lane)
    { n: 4, customer: priya, source: "WEBSITE", bookingType: "OUTSTATION", tripType: "ONE_WAY", pickup: "Malviya Nagar, Jaipur", drop: "Connaught Place, New Delhi",
      pickupDate: at(3, 6, 30), passengers: 3, vehicleType: "SUV", f: fare(280, 14, { driverAllowance: 300, toll: 650 }), status: "BOOKING_CONFIRMED" },
    // Vehicle + driver assigned, ready to dispatch (Ready lane)
    { n: 5, customer: irfan, source: "PHONE", bookingType: "AIRPORT", tripType: "ONE_WAY", pickup: "C-Scheme, Jaipur", drop: "Jaipur International Airport (T2)",
      pickupDate: at(1, 5, 0), passengers: 2, vehicleType: "SUV", f: fare(18, 14, { night: 200, parking: 80 }), status: "DRIVER_ASSIGNED", vehicleId: fleet.innova, driverId: suresh.id },
    // Dispatched: trip created with OTP (Running lane)
    { n: 6, customer: anita, source: "REFERRAL", bookingType: "OUTSTATION", tripType: "ROUND_TRIP", pickup: "Hotel Clarks Amer, JLN Marg, Jaipur", drop: "Taj Mahal East Gate, Agra",
      pickupDate: at(2, 7), returnDate: at(2, 22), passengers: 2, vehicleType: "SEDAN", f: fare(480, 12, { driverAllowance: 400, toll: 820, permit: 300 }), status: "READY_FOR_DISPATCH", vehicleId: fleet.city, driverId: ramesh.id },
    // Trip in progress today
    { n: 7, customer: vikram, source: "WEBSITE", bookingType: "OUTSTATION", tripType: "ROUND_TRIP", pickup: "Bani Park, Jaipur", drop: "Mehrangarh Fort, Jodhpur",
      pickupDate: at(0, 6), returnDate: at(1, 20), passengers: 4, vehicleType: "SUV", f: fare(700, 14, { driverAllowance: 600, toll: 540 }), status: "TRIP_STARTED", vehicleId: fleet.scorpio, driverId: mahendra.id },
    // Completed, invoiced, advance paid, balance due
    { n: 8, customer: rajesh, source: "PHONE", bookingType: "OUTSTATION", tripType: "ROUND_TRIP", pickup: "Bani Park, Jaipur", drop: "Ajmer Sharif Dargah, Ajmer",
      pickupDate: at(-5, 8), returnDate: at(-5, 20), passengers: 4, vehicleType: "SEDAN", f: fare(280, 11, { driverAllowance: 300, toll: 220 }), status: "INVOICE_GENERATED", vehicleId: fleet.etios, driverId: abdul.id },
    // Closed: fully paid, rated, driver settled
    { n: 9, customer: rajesh, source: "WEBSITE", bookingType: "AIRPORT", tripType: "ONE_WAY", pickup: "Jaipur International Airport (T2)", drop: "Bani Park, Jaipur",
      pickupDate: at(-20, 23, 30), passengers: 2, vehicleType: "SUV", f: fare(16, 14, { night: 300, parking: 80 }), status: "CLOSED", vehicleId: fleet.innova, driverId: suresh.id },
    // Cancelled by the customer before assignment
    { n: 10, customer: sneha, source: "WEBSITE", bookingType: "LOCAL", tripType: "ONE_WAY", pickup: "Vaishali Nagar, Jaipur", drop: "Amer Fort, Jaipur",
      pickupDate: at(4, 9), passengers: 2, vehicleType: "SEDAN", f: fare(40, 11), status: "CANCELLED" },
  ];

  const pad = (n: number) => String(n).padStart(3, "0");
  let invoiceSeq = 0;

  for (const s of stages) {
    const lead = await prisma.lead.create({
      data: {
        leadNumber: `LD-DEMO-${pad(s.n)}`, status: "WON", source: s.source, name: s.customer.name, email: s.customer.email,
        phone: s.customer.phone, city: "Jaipur", bookingType: s.bookingType, tripType: s.tripType, pickupAddress: s.pickup,
        dropAddress: s.drop, pickupDate: s.pickupDate, returnDate: s.returnDate, passengers: s.passengers,
        preferredVehicle: s.vehicleType, assignedToId: staff.salesExec.id, branchId,
        convertedAt: new Date(s.pickupDate.getTime() - 3 * day), convertedToCustomerId: s.customer.id,
      },
    });
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber: `QT-DEMO-${pad(s.n)}`, leadId: lead.id, status: "APPROVED", validUntil: new Date(s.pickupDate.getTime() - day),
        bookingType: s.bookingType, tripType: s.tripType, pickupAddress: s.pickup, dropAddress: s.drop, pickupDate: s.pickupDate,
        returnDate: s.returnDate, passengers: s.passengers, vehicleType: s.vehicleType, ...omitSubtotal(s.f),
        createdById: staff.salesExec.id, approvedById: staff.opsManager.id, approvedAt: new Date(s.pickupDate.getTime() - 3 * day), branchId,
      },
    });

    const tripStarted = ["TRIP_STARTED", "INVOICE_GENERATED", "CLOSED"].includes(s.status);
    const tripDone = ["INVOICE_GENERATED", "CLOSED"].includes(s.status);
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `BK-DEMO-${pad(s.n)}`, leadId: lead.id, quotationId: quotation.id, customerId: s.customer.id, branchId,
        bookingType: s.bookingType, tripType: s.tripType, pickupAddress: s.pickup, dropAddress: s.drop, pickupDate: s.pickupDate,
        pickupTime: `${String(s.pickupDate.getHours()).padStart(2, "0")}:${String(s.pickupDate.getMinutes()).padStart(2, "0")}`,
        returnDate: s.returnDate, passengers: s.passengers, bags: s.passengers, preferredCategory: s.vehicleType,
        status: s.status as never, vehicleId: s.vehicleId, driverId: s.driverId,
        baseFare: s.f.baseFare, driverAllowance: s.f.driverAllowance, tollCharges: s.f.tollCharges, parkingCharges: s.f.parkingCharges,
        permitCharges: s.f.permitCharges, nightCharges: s.f.nightCharges, discount: s.f.discount, gst: s.f.gst,
        totalFare: s.f.totalFare, fare: s.f.totalFare, billableKm: s.f.totalKm,
        paymentMethod: s.n === 9 ? "ONLINE" : "CASH",
        paymentStatus: s.status === "CLOSED" ? "PAID" : s.status === "INVOICE_GENERATED" ? "PARTIAL" : "PENDING",
        startTime: tripStarted ? s.pickupDate : null,
        endTime: tripDone ? (s.returnDate ?? new Date(s.pickupDate.getTime() + 45 * 60_000)) : null,
        specialInstructions: s.n === 6 ? "Senior citizens travelling; please help with luggage." : null,
      },
    });

    // Dispatch entry (Operations Queue)
    const dispatched = ["READY_FOR_DISPATCH", "TRIP_STARTED", "INVOICE_GENERATED", "CLOSED"].includes(s.status);
    if (s.status !== "CANCELLED") {
      await prisma.dispatch.create({
        data: {
          bookingId: booking.id, assignedById: staff.opsManager.id,
          status: dispatched ? "DISPATCHED" : s.driverId ? "READY" : "PENDING",
          vehicleId: s.vehicleId, vehicleCheckStatus: s.vehicleId ? "CLEARED" : null,
          vehicleCheckedById: s.vehicleId ? staff.opsManager.id : null, vehicleCheckedAt: s.vehicleId ? at(-1) : null,
          driverId: s.driverId, driverCheckStatus: s.driverId ? "ASSIGNED" : null,
          driverAssignedById: s.driverId ? staff.opsManager.id : null, driverAssignedAt: s.driverId ? at(-1) : null,
        },
      });
    } else {
      await prisma.cancellation.create({
        data: { bookingId: booking.id, cancelledById: s.customer.id, reason: "Plans changed: visiting Amer Fort next month instead." },
      });
    }

    // Trip (only created by dispatch)
    if (!dispatched) continue;
    const trip = await prisma.trip.create({
      data: {
        tripNumber: `TR-DEMO-${pad(s.n)}`, bookingId: booking.id, vehicleId: s.vehicleId, driverId: s.driverId,
        status: s.status === "READY_FOR_DISPATCH" ? "SCHEDULED" : s.status === "TRIP_STARTED" ? "IN_PROGRESS" : "COMPLETED",
        pickupAddress: s.pickup, dropAddress: s.drop, scheduledPickupTime: s.pickupDate, otp: String(randomInt(1000, 10000)),
        actualPickupTime: tripStarted ? s.pickupDate : null,
        actualDropTime: tripDone ? (s.returnDate ?? new Date(s.pickupDate.getTime() + 45 * 60_000)) : null,
        startOdometer: tripStarted ? 48_210 + s.n * 1000 : null,
        endOdometer: tripDone ? 48_210 + s.n * 1000 + s.f.totalKm : null,
        actualDistance: tripDone ? s.f.totalKm : null,
      },
    });
    if (s.status === "TRIP_STARTED") {
      await prisma.driverStatus.update({ where: { driverId: s.driverId! }, data: { online: true, lat: 26.9157, lng: 75.8059 } });
    }
    if (!tripDone) continue;

    // Driver trip expenses
    await prisma.expense.createMany({
      data: [
        { description: "Toll plazas (both ways)", amount: s.f.tollCharges || 120, category: "TOLL", vehicleId: s.vehicleId, tripId: trip.id, bookingId: booking.id, paidById: s.driverId },
        { description: "Diesel refill", amount: Math.round(s.f.totalKm * 7.2), category: "FUEL", vehicleId: s.vehicleId, tripId: trip.id, bookingId: booking.id, paidById: s.driverId },
      ],
    });

    // Invoice + payments (paid amounts come only from recorded payments)
    invoiceSeq += 1;
    const subtotal = s.f.subtotal;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-DEMO-${pad(invoiceSeq)}`, bookingId: booking.id, customerId: s.customer.id, branchId,
        status: s.status === "CLOSED" ? "PAID" : "PARTIALLY_PAID", subtotal, gst: s.f.gst, discount: 0, total: s.f.totalFare,
        paidAmount: s.status === "CLOSED" ? s.f.totalFare : 1000, paymentStatus: s.status === "CLOSED" ? "PAID" : "PARTIAL",
        paymentMethod: s.status === "CLOSED" ? "ONLINE" : "CASH", dueDate: at(s.status === "CLOSED" ? -15 : 5),
        paidAt: s.status === "CLOSED" ? at(-19) : null,
      },
    });
    if (s.status === "CLOSED") {
      await prisma.payment.create({
        data: {
          paymentNumber: `PAY-DEMO-${pad(s.n)}A`, bookingId: booking.id, invoiceId: invoice.id, customerId: s.customer.id, type: "FULL",
          amount: s.f.totalFare, method: "ONLINE", reference: "UPI 4198-2207-6631", receivedById: staff.finance.id, receivedAt: at(-19),
        },
      });
      await prisma.rating.create({
        data: { bookingId: booking.id, raterId: s.customer.id, ratedId: s.driverId!, score: 5, comment: "Driver was waiting at arrivals despite the late flight. Very polite." },
      });
      const expenses = (s.f.tollCharges || 120) + Math.round(s.f.totalKm * 7.2);
      await prisma.settlement.create({
        data: {
          tripId: trip.id, driverId: s.driverId!, totalEarnings: 900, advancePaid: 0, expenses, netPayable: 900 + expenses,
          status: "PAID", paidAt: at(-15), notes: "Night airport duty: ₹900 + reimbursed trip expenses.",
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          paymentNumber: `PAY-DEMO-${pad(s.n)}A`, bookingId: booking.id, invoiceId: invoice.id, customerId: s.customer.id, type: "ADVANCE",
          amount: 1000, method: "CASH", reference: "Receipt #A-1042", receivedById: staff.finance.id, receivedAt: at(-6),
        },
      });
    }
  }

  console.log("Demo pipeline: 3 open leads, 7 bookings (awaiting, assigned, dispatched, in progress, invoiced, closed, cancelled)");
}

function omitSubtotal<T extends { subtotal: number }>(f: T): Omit<T, "subtotal"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { subtotal, ...rest } = f;
  return rest;
}

function printCredentials() {
  if (credentials.length === 0) {
    console.log("\nNo new accounts were created (existing passwords are unchanged).");
    return;
  }
  console.log("\n📋 New login credentials (shown once; store them in your password manager):");
  console.log("   Staff sign in at /admin/login, drivers and customers at /login.\n");
  for (const c of credentials) {
    console.log(`   ${c.role.padEnd(17)} ${c.name.padEnd(26)} ${c.email.padEnd(38)} ${c.password}`);
  }
}

// =====================================================================================
// Website content, fleet catalogue and pricing (unchanged from the original seed)
// =====================================================================================

async function seedContent() {
  // ====== CMS: Website Settings ======
  const defaultSettings = [
    { key: "company_name", value: "Aradhana Travel Services" },
    { key: "company_description", value: "Your trusted cab service & tour operator in Rajasthan since 2015." },
    { key: "phone_primary", value: "+91 98765 43210" },
    { key: "whatsapp_number", value: "+91 98765 43210" },
    { key: "email_primary", value: "info@aradhanatravel.com" },
    { key: "email_support", value: "support@aradhanatravel.com" },
    { key: "office_address", value: "G-3A, Rajputana Tower, Khatipura, Jaipur, Rajasthan 302012" },
    { key: "business_hours", value: "Mon - Sat: 6:00 AM - 10:00 PM" },
    { key: "footer_copyright", value: "&copy; 2026 Aradhana Travel Services. All rights reserved." },
    { key: "footer_description", value: "Premium cab services, Rajasthan tours, and reliable transportation since 2015." },
    { key: "seo_default_title", value: "Aradhana Travel - Premium Cab Service & Rajasthan Tour Operator" },
    { key: "seo_default_description", value: "Book premium cabs, tempo travellers, and Rajasthan tour packages. Trusted cab service in Jaipur for outstation, local, and airport transfers." },
    { key: "seo_keywords", value: "cab service jaipur, outstation cabs, tempo traveller hire, rajasthan tour operator, taxi service" },
    { key: "social_facebook", value: "https://facebook.com/aradhanatravel" },
    { key: "social_instagram", value: "https://instagram.com/aradhanatravel" },
    { key: "social_twitter", value: "https://twitter.com/aradhanatravel" },
    { key: "social_youtube", value: "https://youtube.com/@aradhanatravel" },
    { key: "website_status", value: "online" },
    { key: "maintenance_mode", value: "false" },
  ];

  for (const setting of defaultSettings) {
    await prisma.websiteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log("Created website settings");

  // ====== CMS: Navigation ======
  const headerNav = await prisma.navigation.upsert({
    where: { slug: "main-menu" },
    update: {},
    create: {
      name: "Main Menu",
      slug: "main-menu",
      location: "HEADER",
      sortOrder: 1,
      items: {
        create: [
          { label: "Home", url: "/", sortOrder: 1, target: "_self" },
          { label: "Destinations", url: "/destinations", sortOrder: 2, target: "_self" },
          { label: "Tours", url: "/tours", sortOrder: 3, target: "_self" },
          { label: "Services", url: "/services", sortOrder: 4, target: "_self" },
          { label: "Blog", url: "/blog", sortOrder: 5, target: "_self" },
          { label: "Contact", url: "/contact", sortOrder: 6, target: "_self" },
        ],
      },
    },
  });
  console.log("Created header navigation");

  const footerNav = await prisma.navigation.upsert({
    where: { slug: "footer-menu" },
    update: {},
    create: {
      name: "Footer Menu",
      slug: "footer-menu",
      location: "FOOTER",
      sortOrder: 2,
      items: {
        create: [
          { label: "Home", url: "/", sortOrder: 1, target: "_self" },
          { label: "About Us", url: "/about", sortOrder: 2, target: "_self" },
          { label: "Privacy Policy", url: "/privacy-policy", sortOrder: 3, target: "_self" },
          { label: "Terms & Conditions", url: "/terms-and-conditions", sortOrder: 4, target: "_self" },
          { label: "Contact", url: "/contact", sortOrder: 5, target: "_self" },
        ],
      },
    },
  });
  console.log("Created footer navigation");

  // ====== CMS: Sample Static Pages ======
  const aboutPage = await prisma.staticPage.upsert({
    where: { slug: "about" },
    update: {},
    create: {
      title: "About Us",
      slug: "about",
      content: "<h2>Welcome to Aradhana Travel Services</h2><p>We are a premier cab service and tour operator based in Jaipur, Rajasthan. With over a decade of experience, we have served thousands of happy customers across the state.</p><p>Our fleet includes sedans, SUVs, and tempo travellers for all your travel needs - whether it's a local city ride, an outstation trip, or a Rajasthan tour package.</p><h3>Why Choose Us?</h3><ul><li>Experienced and courteous drivers</li><li>Well-maintained, clean vehicles</li><li>Transparent pricing with no hidden charges</li><li>24/7 customer support</li><li>GPS-enabled vehicles for safety</li></ul>",
      status: "PUBLISHED",
      showInFooter: true,
      sortOrder: 1,
      metaTitle: "About Aradhana Travel - Premium Cab Service in Jaipur",
      metaDesc: "Learn about Aradhana Travel Services, Jaipur's trusted cab service and tour operator with 10+ years of experience.",
    },
  });
  console.log("Created About page");

  const privacyPage = await prisma.staticPage.upsert({
    where: { slug: "privacy-policy" },
    update: {},
    create: {
      title: "Privacy Policy",
      slug: "privacy-policy",
      content: "<h2>Privacy Policy</h2><p>At Aradhana Travel Services, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.</p><h3>Information We Collect</h3><p>We collect information you provide when booking a cab, including your name, phone number, email address, and pickup/drop locations.</p><h3>How We Use Your Information</h3><p>We use your information solely to provide and improve our cab booking services, communicate with you about your bookings, and send service-related updates.</p><h3>Data Protection</h3><p>We implement security measures to protect your personal information. We do not share your data with third parties except as necessary to provide our services.</p>",
      status: "PUBLISHED",
      showInFooter: true,
      sortOrder: 2,
      metaTitle: "Privacy Policy - Aradhana Travel",
    },
  });
  console.log("Created Privacy Policy page");

  const termsPage = await prisma.staticPage.upsert({
    where: { slug: "terms-and-conditions" },
    update: {},
    create: {
      title: "Terms & Conditions",
      slug: "terms-and-conditions",
      content: "<h2>Terms & Conditions</h2><p>By using Aradhana Travel Services, you agree to the following terms and conditions.</p><h3>Booking</h3><p>All bookings are subject to availability. We reserve the right to cancel or modify bookings under exceptional circumstances.</p><h3>Pricing</h3><p>Fares are calculated based on distance, vehicle type, and applicable charges. Toll, parking, and state taxes are extra unless specified.</p><h3>Cancellation</h3><p>Cancellation charges may apply based on the time of cancellation before the scheduled pickup.</p>",
      status: "PUBLISHED",
      showInFooter: true,
      sortOrder: 3,
      metaTitle: "Terms & Conditions - Aradhana Travel",
    },
  });
  console.log("Created Terms page");

  // Create sample blog post
  const sampleBlog = await prisma.blogPost.upsert({
    where: { slug: "best-outstation-cab-service-jaipur" },
    update: {},
    create: {
      title: "Best Outstation Cab Service in Jaipur - Your Complete Guide",
      slug: "best-outstation-cab-service-jaipur",
      content: "<h2>Why Choose Our Outstation Cab Service?</h2><p>Jaipur, the Pink City, is not just a destination - it's a gateway to the magnificent state of Rajasthan. Whether you're planning a trip to Udaipur, Jaisalmer, Jodhpur, or Pushkar, having a reliable outstation cab service makes all the difference.</p><h3>Benefits of Booking with Us</h3><ul><li><strong>Professional Drivers:</strong> Our drivers are experienced, courteous, and know the routes well.</li><li><strong>Well-Maintained Fleet:</strong> From sedans to tempo travellers, all vehicles are regularly serviced.</li><li><strong>Transparent Pricing:</strong> No hidden charges. What you see is what you pay.</li><li><strong>24/7 Support:</strong> We're always available to help you.</li></ul><h3>Popular Outstation Routes from Jaipur</h3><p>Some of our most booked routes include Jaipur to Delhi, Jaipur to Agra, Jaipur to Udaipur, and Jaipur to Jaisalmer. Each route offers unique experiences and scenic beauty.</p>",
      shortDesc: "Looking for the best outstation cab service in Jaipur? Read our complete guide covering fleet, pricing, popular routes, and why thousands trust Aradhana Travel.",
      category: "Travel Guide",
      author: "Aradhana Travel",
      publishedDate: new Date(),
      status: "PUBLISHED",
      featured: true,
      metaTitle: "Best Outstation Cab Service in Jaipur | Aradhana Travel",
      metaDesc: "Complete guide to outstation cab service in Jaipur. Compare sedan, SUV, and tempo traveller options for your Rajasthan trip.",
    },
  });
  console.log("Created sample blog post");

  // ====== Fleet: Sample Vehicles ======
  const fleetVehicles = [
    {
      name: "Toyota Etios",
      slug: "toyota-etios",
      color: "White",
      model: "Toyota Etios",
      plateNumber: "CMS-FLEET-001",
      type: "SEDAN" as const,
      seats: 4,
      luggage: 2,
      ac: true,
      fuelType: "PETROL",
      transmission: "MANUAL",
      pricePerKm: 11,
      minKmPerDay: 250,
      nightCharge: 200,
      shortDescription: "Comfortable sedan perfect for city rides and short outstation trips.",
      longDescription: "The Toyota Etios offers a smooth and comfortable ride for up to 4 passengers. With ample legroom and a spacious boot, it's ideal for airport transfers, local city travel, and short outstation trips. Well-maintained and clean, our Etios fleet ensures a pleasant journey every time.",
      features: ["GPS Tracking", "Music System", "Charging Points", "Clean & Hygienic", "Experienced Driver"],
      images: [],
      isFeatured: true,
      displayOrder: 1,
    },
    {
      name: "Toyota Innova Crysta",
      slug: "innova-crysta",
      color: "White",
      model: "Toyota Innova Crysta",
      plateNumber: "CMS-FLEET-002",
      type: "SUV" as const,
      seats: 7,
      luggage: 4,
      ac: true,
      fuelType: "DIESEL",
      transmission: "MANUAL",
      pricePerKm: 14,
      minKmPerDay: 300,
      nightCharge: 300,
      shortDescription: "Spacious 7-seater SUV, ideal for family trips and group travel.",
      longDescription: "The Toyota Innova Crysta is the most popular choice for family outstation trips. With generous space for 7 passengers, comfortable captain seats, and powerful engine, it handles long journeys with ease. Features a large boot and premium interiors for a first-class travel experience.",
      features: ["Captain Seats", "GPS Tracking", "Music System", "Charging Points", "Pushback Seats", "Clean & Hygienic"],
      images: [],
      isFeatured: true,
      displayOrder: 2,
    },
    {
      name: "Mahindra Scorpio",
      slug: "mahindra-scorpio",
      color: "Black",
      model: "Mahindra Scorpio",
      plateNumber: "CMS-FLEET-003",
      type: "SUV" as const,
      seats: 7,
      luggage: 4,
      ac: true,
      fuelType: "DIESEL",
      transmission: "MANUAL",
      pricePerKm: 14,
      minKmPerDay: 300,
      nightCharge: 300,
      shortDescription: "Rugged SUV for rough terrains and long distance travel.",
      longDescription: "The Mahindra Scorpio is built for the Indian roads. Its powerful diesel engine and high ground clearance make it perfect for long distance travel and rough terrains. Comfortable seating for 7 with a sturdy build ensures safety and reliability on every trip.",
      features: ["GPS Tracking", "Music System", "Charging Points", "High Ground Clearance", "Powerful Engine"],
      images: [],
      isFeatured: false,
      displayOrder: 3,
    },
    {
      name: "Force Tempo Traveller",
      slug: "tempo-traveller",
      color: "White",
      model: "Force Tempo Traveller",
      plateNumber: "CMS-FLEET-004",
      type: "TEMPO_TRAVELLER" as const,
      seats: 12,
      luggage: 8,
      ac: true,
      fuelType: "DIESEL",
      transmission: "MANUAL",
      pricePerKm: 22,
      minKmPerDay: 350,
      nightCharge: 500,
      shortDescription: "12-seater tempo traveller for group tours and family gatherings.",
      longDescription: "Our Tempo Traveller is the perfect choice for group travel. With 12 comfortable pushback seats, ample luggage space, and a powerful AC, it's ideal for family reunions, group tours, wedding events, and corporate outings.",
      features: ["Pushback Seats", "GPS Tracking", "Music System", "Charging Points", "Large Luggage Space", "Clean & Hygienic"],
      images: [],
      isFeatured: true,
      displayOrder: 4,
    },
  ];

  for (const v of fleetVehicles) {
    await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: {},
      create: v,
    });
  }
  console.log("Created fleet vehicles");

  // ====== Pricing: Enhanced Data ======
  const pricingData = [
    { vehicleType: "SEDAN" as const, baseFare: 150, perKm: 11, perMinute: 1, minKm: 250, nightCharge: 200, driverCharge: 0, waitingCharge: 50, eventMin: 1800, eventMax: 3500, monthlyMin: 12000, monthlyMax: 25000 },
    { vehicleType: "SUV" as const, baseFare: 200, perKm: 14, perMinute: 2, minKm: 300, nightCharge: 300, driverCharge: 0, waitingCharge: 50, eventMin: 2500, eventMax: 5000, monthlyMin: 20000, monthlyMax: 40000 },
    { vehicleType: "HATCHBACK" as const, baseFare: 100, perKm: 9, perMinute: 1, minKm: 200, nightCharge: 150, driverCharge: 0, waitingCharge: 50, eventMin: 1500, eventMax: 2500, monthlyMin: 9000, monthlyMax: 18000 },
    { vehicleType: "TEMPO_TRAVELLER" as const, baseFare: 500, perKm: 22, perMinute: 3, minKm: 350, nightCharge: 500, driverCharge: 0, waitingCharge: 100, eventMin: 4000, eventMax: 8000, monthlyMin: 35000, monthlyMax: 60000 },
    { vehicleType: "LUXURY" as const, baseFare: 500, perKm: 25, perMinute: 3, minKm: 300, nightCharge: 500, driverCharge: 0, waitingCharge: 100, eventMin: 5000, eventMax: 10000, monthlyMin: 45000, monthlyMax: 80000 },
  ];

  for (const p of pricingData) {
    await prisma.pricing.upsert({
      where: { vehicleType: p.vehicleType },
      update: p,
      create: p,
    });
  }
  console.log("Created enhanced pricing data");

  // ====== Pricing Page Content ======
  const existingPage = await prisma.pricingPage.findFirst();
  if (existingPage) {
    await prisma.pricingPage.update({
      where: { id: existingPage.id },
      data: {
        content: "<p>At Aradhana Travel Services, we believe in complete transparency. Our pricing is simple, fair, and clearly communicated before every trip. No hidden charges, no surprises.</p>",
        parkingPolicy: "Parking charges are extra as applicable. If parking is not available at pickup/drop location, the driver may park at a nearby paid parking lot and the cost will be added to the bill.",
        tollPolicy: "Toll charges are extra and will be charged as per actuals. Bothway toll charges apply for round trips.",
        stateTaxPolicy: "State tax of 5% applies on outstation trips entering other states. This is charged as per RTO guidelines.",
        cancellationPolicy: "Free cancellation up to 2 hours before pickup. After that, 50% of the fare will be charged as cancellation fee. No-show charges full fare.",
        refundPolicy: "Refunds for cancellations are processed within 5-7 working days. Online payments will be refunded to the original payment method.",
        gstPercentage: 5,
        seasonalPricing: "Peak season rates may apply during Diwali, New Year, and major festivals. Please check with our team for current rates.",
        specialOffers: "Round trip discount: Get 10% off on round trips above 500km. Group booking: Special rates for groups of 6+. Early bird: Book 7 days in advance and get 5% discount.",
      },
    });
  } else {
    await prisma.pricingPage.create({
      data: {
        content: "<p>At Aradhana Travel Services, we believe in complete transparency. Our pricing is simple, fair, and clearly communicated before every trip. No hidden charges, no surprises.</p>",
        parkingPolicy: "Parking charges are extra as applicable.",
        tollPolicy: "Toll charges are extra as per actuals.",
        stateTaxPolicy: "State tax of 5% on outstation trips.",
        cancellationPolicy: "Free cancellation up to 2 hours before pickup.",
        refundPolicy: "Refunds processed within 5-7 working days.",
        gstPercentage: 5,
        seasonalPricing: "Peak season rates may apply during festivals.",
        specialOffers: "Round trip discount: 10% off on trips above 500km.",
      },
    });
  }
  console.log("Created pricing page content");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
