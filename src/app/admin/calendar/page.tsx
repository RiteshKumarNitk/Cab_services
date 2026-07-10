import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarView } from "./calendar-view";

interface Props {
  searchParams: Promise<{ view?: string; year?: string; month?: string }>;
}

export default async function CalendarPage({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const view = params.view ?? "bookings";

  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()));
  const month = parseInt(params.month ?? String(now.getMonth()));

  return <CalendarView initialView={view} initialYear={year} initialMonth={month} />;
}
