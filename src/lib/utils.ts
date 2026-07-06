import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Haversine distance calculation
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Fare calculation
export interface FareInput {
  vehicleType: "SEDAN" | "SUV";
  bookingType: "LOCAL" | "OUTSTATION" | "AIRPORT" | "MONTHLY" | "EVENT";
  distance?: number;
  duration?: number;
  pricing: {
    baseFare: number;
    perKm: number;
    perMinute: number;
    eventMin: number;
    eventMax: number;
    monthlyMin: number;
    monthlyMax: number;
  };
}

export function calculateFare(input: FareInput): {
  fare: number;
  breakdown: { label: string; amount: number }[];
} {
  const { bookingType, distance, duration, pricing } = input;
  const breakdown: { label: string; amount: number }[] = [];

  switch (bookingType) {
    case "MONTHLY": {
      const monthlyFare = (pricing.monthlyMin + pricing.monthlyMax) / 2;
      breakdown.push({ label: "Monthly Rental", amount: monthlyFare });
      return { fare: monthlyFare, breakdown };
    }
    case "EVENT": {
      const eventFare = (pricing.eventMin + pricing.eventMax) / 2;
      breakdown.push({ label: "Event Package", amount: eventFare });
      return { fare: eventFare, breakdown };
    }
    default: {
      let fare = pricing.baseFare;
      breakdown.push({ label: "Base Fare", amount: pricing.baseFare });

      if (distance) {
        const distanceCharge = distance * pricing.perKm;
        fare += distanceCharge;
        breakdown.push({
          label: `Distance (${distance.toFixed(1)} km × ₹${pricing.perKm})`,
          amount: distanceCharge,
        });
      }

      if (duration) {
        const timeCharge = duration * pricing.perMinute;
        fare += timeCharge;
        breakdown.push({
          label: `Time (${duration} min × ₹${pricing.perMinute})`,
          amount: timeCharge,
        });
      }

      return { fare, breakdown };
    }
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Format date
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Format time
export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format datetime
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

// Get booking status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    REQUESTED: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-blue-100 text-blue-800",
    STARTED: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

// Get booking type display name
export function getBookingTypeName(type: string): string {
  const names: Record<string, string> = {
    LOCAL: "Local",
    OUTSTATION: "Outstation",
    AIRPORT: "Airport Transfer",
    MONTHLY: "Monthly Rental",
    EVENT: "Event Package",
  };
  return names[type] || type;
}

// Estimate travel time (rough: ~30 km/h average city speed)
export function estimateTime(distanceKm: number): number {
  const avgSpeed = 30;
  return Math.ceil((distanceKm / avgSpeed) * 60);
}

// Generate a unique booking reference
export function generateBookingRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "ARH";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// CSV export
export function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      const escaped = String(val ?? "").replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
}
