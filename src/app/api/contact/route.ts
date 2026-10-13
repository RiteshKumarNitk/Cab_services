import { NextResponse } from "next/server";
import { z } from "zod";
import { createContactSubmission } from "@/lib/cms";
import { fieldErrors } from "@/lib/enquiry-validation";

// Public contact / feedback form. Submissions appear in Admin → CMS → Contacts.
const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.email("Please enter a valid email"),
  phone: z.string().trim().max(20).optional().transform((v) => v || undefined),
  subject: z.string().trim().max(150).optional().transform((v) => v || undefined),
  message: z.string().trim().min(5, "Please enter a message").max(5000),
  department: z.enum(["contact", "feedback"]).default("contact"),
  website: z.string().max(0, "Invalid submission").optional(), // honeypot
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = contactSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please correct the highlighted fields", fields: fieldErrors(parsed.error) },
        { status: 400 }
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { website, ...data } = parsed.data;
    await createContactSubmission(data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error saving contact submission:", error);
    return NextResponse.json({ error: "Could not send your message. Please call or WhatsApp us." }, { status: 500 });
  }
}
