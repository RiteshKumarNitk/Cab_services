import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enquirySchema, fieldErrors } from "@/lib/enquiry-validation";
import { createEnquiryLead } from "@/lib/enquiries";

// Public endpoint: website trip enquiries become Leads in Sales & CRM.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = enquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please correct the highlighted fields", fields: fieldErrors(parsed.error) },
        { status: 400 }
      );
    }

    const session = await auth();
    const { lead, duplicate } = await createEnquiryLead(parsed.data, { userId: session?.user?.id });

    // Only return what the visitor needs: never internal lead details.
    return NextResponse.json(
      { reference: lead.leadNumber, duplicate },
      { status: duplicate ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error creating enquiry:", error);
    return NextResponse.json({ error: "Could not submit your request. Please call us instead." }, { status: 500 });
  }
}
