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
