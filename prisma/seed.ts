import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@aradhana.com" },
    update: {},
    create: {
      email: "admin@aradhana.com",
      passwordHash: adminPassword,
      name: "Aradhana Admin",
      phone: "08069247178",
      role: "ADMIN",
    },
  });
  console.log("Created admin user:", admin.email);

  // Create sample driver
  const driverPassword = await bcrypt.hash("driver123", 12);
  const driver = await prisma.user.upsert({
    where: { email: "driver@aradhana.com" },
    update: {},
    create: {
      email: "driver@aradhana.com",
      passwordHash: driverPassword,
      name: "Rahul Sharma",
      phone: "9876543210",
      role: "DRIVER",
    },
  });

  // Create driver status
  await prisma.driverStatus.upsert({
    where: { driverId: driver.id },
    update: {},
    create: {
      driverId: driver.id,
      online: false,
    },
  });
  console.log("Created driver user:", driver.email);

  // Create sample customer
  const customerPassword = await bcrypt.hash("customer123", 12);
  const customer = await prisma.user.upsert({
    where: { email: "customer@aradhana.com" },
    update: {},
    create: {
      email: "customer@aradhana.com",
      passwordHash: customerPassword,
      name: "Priya Patel",
      phone: "9876543211",
      role: "CUSTOMER",
    },
  });
  console.log("Created customer user:", customer.email);

  // Create vehicles
  const vehicles = [
    {
      plateNumber: "RJ-14-XX-1001",
      model: "Toyota Etios",
      color: "White",
      seats: 4,
      luggage: 2,
      type: "SEDAN" as const,
      driverId: driver.id,
    },
    {
      plateNumber: "RJ-14-XX-1002",
      model: "Honda City",
      color: "Silver",
      seats: 4,
      luggage: 2,
      type: "SEDAN" as const,
      driverId: null,
    },
    {
      plateNumber: "RJ-14-XX-2001",
      model: "Toyota Innova",
      color: "White",
      seats: 7,
      luggage: 4,
      type: "SUV" as const,
      driverId: null,
    },
    {
      plateNumber: "RJ-14-XX-2002",
      model: "Mahindra Scorpio",
      color: "Black",
      seats: 7,
      luggage: 4,
      type: "SUV" as const,
      driverId: null,
    },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: {},
      create: v,
    });
  }
  console.log("Created vehicles");

  // Create pricing
  const pricingData = [
    {
      vehicleType: "SEDAN" as const,
      baseFare: 50,
      perKm: 11,
      perMinute: 1,
      eventMin: 1800,
      eventMax: 3500,
      monthlyMin: 12000,
      monthlyMax: 25000,
    },
    {
      vehicleType: "SUV" as const,
      baseFare: 100,
      perKm: 25,
      perMinute: 2,
      eventMin: 2500,
      eventMax: 5000,
      monthlyMin: 20000,
      monthlyMax: 40000,
    },
  ];

  for (const p of pricingData) {
    await prisma.pricing.upsert({
      where: { vehicleType: p.vehicleType },
      update: {},
      create: p,
    });
  }
  console.log("Created pricing data");

  // Create a sample completed booking for demo
  const sampleBooking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      driverId: driver.id,
      bookingType: "LOCAL",
      tripType: "ONE_WAY",
      pickupAddress: "Jaipur Railway Station",
      dropAddress: "Hawa Mahal, Jaipur",
      pickupDate: new Date(),
      pickupTime: "10:00",
      totalFare: 250,
      baseFare: 250,
      billableKm: 10,
      distance: 8.5,
      duration: 20,
      status: "COMPLETED",
      paymentStatus: "PAID",
      paymentMethod: "CASH",
    },
  });
  console.log("Created sample booking");

  console.log("\n✅ Seed completed!");
  console.log("\n📋 Login Credentials:");
  console.log("   Admin:    admin@aradhana.com / admin123");
  console.log("   Driver:   driver@aradhana.com / driver123");
  console.log("   Customer: customer@aradhana.com / customer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
