import { z } from "zod";

// Pure validation for public trip enquiries (no database access, unit tested).

export function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0[6-9]\d{9}$/.test(digits)) return `+91${digits.slice(1)}`;
  return null;
}

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

/** Parse "YYYY-MM-DD" (date input) or an ISO timestamp. */
const dateString = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date")
  .transform((v) => new Date(v));

export const enquirySchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name").max(100),
    phone: z.string().trim().transform((v, ctx) => {
      const phone = normalizeIndianPhone(v);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "Please enter a valid 10-digit mobile number" });
        return z.NEVER;
      }
      return phone;
    }),
    email: z.union([z.literal(""), z.email("Please enter a valid email")]).optional().transform((v) => v || undefined),
    pickupAddress: z.string().trim().min(2, "Please enter a pickup location").max(300),
    dropAddress: optionalText(300),
    pickupDate: dateString,
    returnDate: z.union([z.literal(""), dateString]).optional().transform((v) => (v instanceof Date ? v : undefined)),
    tripType: z.enum(["ONE_WAY", "ROUND_TRIP", "MULTI_CITY"]).default("ONE_WAY"),
    bookingType: z.enum(["LOCAL", "OUTSTATION", "AIRPORT", "MONTHLY", "EVENT"]).optional(),
    passengers: z.coerce.number().int().min(1).max(60).optional(),
    preferredVehicle: z.enum(["SEDAN", "SUV", "HATCHBACK", "TEMPO_TRAVELLER", "LUXURY", "BUS", "MINI_BUS"]).optional(),
    notes: optionalText(1000),
    // Honeypot: real users never see or fill this field.
    website: z.string().max(0, "Invalid submission").optional(),
  })
  .superRefine((data, ctx) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (data.pickupDate < today) {
      ctx.addIssue({ code: "custom", path: ["pickupDate"], message: "Pickup date cannot be in the past" });
    }
    if (data.returnDate && data.returnDate < data.pickupDate) {
      ctx.addIssue({ code: "custom", path: ["returnDate"], message: "Return date must be after the pickup date" });
    }
    if (data.tripType === "ROUND_TRIP" && !data.returnDate) {
      ctx.addIssue({ code: "custom", path: ["returnDate"], message: "Please choose a return date for a round trip" });
    }
  });

export type EnquiryInput = z.input<typeof enquirySchema>;
export type Enquiry = z.output<typeof enquirySchema>;

/** Field -> first error message, for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
