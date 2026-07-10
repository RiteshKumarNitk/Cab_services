import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CreditCard,
  Receipt,
  Undo2,
  UserCheck,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  IndianRupee,
  Clock,
} from "lucide-react";
import {
  RecordPaymentDialog,
  GenerateInvoiceDialog,
  LogExpenseDialog,
  DriverSettlementDialog,
} from "./_components/finance-dialogs";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const TABS = [
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "expenses", label: "Expenses", icon: Wallet },
  { key: "settlements", label: "Settlements", icon: UserCheck },
  { key: "refunds", label: "Refunds", icon: Undo2 },
] as const;

async function getKpiData() {
  const [paymentAgg, expenseAgg, invoices] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.invoice.findMany({ select: { total: true, paidAmount: true } }),
  ]);

  const collected = paymentAgg._sum.amount || 0;
  const totalExpenses = expenseAgg._sum.amount || 0;
  const outstanding = invoices.reduce((acc, inv) => acc + (inv.total - inv.paidAmount), 0);
  const netProfit = collected - totalExpenses;

  return { collected, totalExpenses, outstanding, netProfit };
}

export default async function FinancePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const { tab } = await searchParams;
  const kpi = await getKpiData();

  const [bookings, vehicles, drivers] = await Promise.all([
    prisma.booking.findMany({
      where: { status: { notIn: ["CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, bookingNumber: true, fare: true, customer: { select: { name: true } } },
    }),
    prisma.vehicle.findMany({
      where: { status: "AVAILABLE" },
      select: { id: true, plateNumber: true },
    }),
    prisma.user.findMany({
      where: { role: "DRIVER", isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <p className="text-gray-500 mt-1">Manage payments, invoices, expenses, and driver settlements</p>
      </div>

      <KpiCards {...kpi} />

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-6 -mb-px">
          <Link
            href="/admin/finance"
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              !tab ? "text-blue-600 border-blue-600" : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Dashboard
          </Link>
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin/finance?tab=${t.key}`}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                tab === t.key ? "text-blue-600 border-blue-600" : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {tab === "payments" && <PaymentsContent />}
      {tab === "invoices" && <InvoicesContent bookings={bookings} />}
      {tab === "expenses" && <ExpensesContent vehicles={vehicles} />}
      {tab === "settlements" && <SettlementsContent drivers={drivers} />}
      {tab === "refunds" && <RefundsContent />}
      {!tab && <DashboardContent bookings={bookings} vehicles={vehicles} drivers={drivers} />}
    </div>
  );
}

async function KpiCards({
  collected,
  totalExpenses,
  outstanding,
  netProfit,
}: {
  collected: number;
  totalExpenses: number;
  outstanding: number;
  netProfit: number;
}) {
  const items = [
    { label: "Total Collected", value: collected, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Total Expenses", value: totalExpenses, icon: TrendingDown, color: "text-red-600", bg: "bg-red-100" },
    { label: "Outstanding", value: outstanding, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Net Profit", value: netProfit, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-100" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((kpi) => (
        <Card key={kpi.label} className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{kpi.label}</span>
              <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${kpi.value < 0 && kpi.label === "Net Profit" ? "text-red-600" : "text-gray-900"}`}>
              {formatCurrency(kpi.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function DashboardContent({
  bookings,
  vehicles,
  drivers,
}: {
  bookings: { id: string; bookingNumber: string; fare: number; customer: { name: string } | null }[];
  vehicles: { id: string; plateNumber: string }[];
  drivers: { id: string; name: string }[];
}) {
  const [recentPayments, recentExpenses] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { receivedAt: "desc" },
      take: 5,
      include: { booking: { select: { bookingNumber: true } }, receivedBy: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: { vehicle: { select: { plateNumber: true } } },
    }),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <RecordPaymentDialog bookings={bookings} />
          <GenerateInvoiceDialog bookings={bookings} />
          <LogExpenseDialog vehicles={vehicles} />
          <DriverSettlementDialog drivers={drivers} />
        </div>
      </div>
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-sm">Recent Payments</CardTitle></CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-gray-400 text-center py-6 text-sm">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-gray-500">{p.type}{p.booking ? ` - ${p.booking.bookingNumber}` : ""}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(p.receivedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-sm">Recent Expenses</CardTitle></CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <p className="text-gray-400 text-center py-6 text-sm">No expenses yet</p>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(e.amount)}</p>
                      <p className="text-xs text-gray-500">{e.category}{e.vehicle ? ` - ${e.vehicle.plateNumber}` : ""}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(e.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function PaymentsContent() {
  const payments = await prisma.payment.findMany({
    orderBy: { receivedAt: "desc" },
    include: {
      booking: { select: { bookingNumber: true } },
      customer: { select: { name: true } },
      receivedBy: { select: { name: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">All Payments</h2>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Payment#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Booking#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Customer</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Method</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Received By</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono text-xs">{p.paymentNumber}</td>
                    <td className="py-3 px-4">{p.booking?.bookingNumber ?? "-"}</td>
                    <td className="py-3 px-4">{p.customer?.name ?? "-"}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-4"><Badge variant="secondary">{p.method}</Badge></td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.type === "REFUND" ? "bg-red-50 text-red-700" :
                        p.type === "ADVANCE" ? "bg-blue-50 text-blue-700" :
                        p.type === "FULL" ? "bg-emerald-50 text-emerald-700" :
                        "bg-purple-50 text-purple-700"
                      }`}>{p.type}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(p.receivedAt)}</td>
                    <td className="py-3 px-4 text-gray-500">{p.receivedBy?.name ?? "-"}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={8} className="py-16 text-center text-gray-400">
                    <IndianRupee className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p>No payments yet</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function InvoicesContent({
  bookings,
}: {
  bookings: { id: string; bookingNumber: string; fare: number; customer: { name: string } | null }[];
}) {
  const invoiceList = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      booking: { select: { bookingNumber: true } },
      customer: { select: { name: true } },
      payments: { select: { amount: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">All Invoices</h2>
        <GenerateInvoiceDialog bookings={bookings} />
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Invoice#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Booking</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Customer</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Subtotal</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">GST</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Total</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Paid</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoiceList.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4">{inv.booking?.bookingNumber ?? "-"}</td>
                    <td className="py-3 px-4">{inv.customer?.name ?? "-"}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(inv.gst)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(inv.total)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(inv.paidAmount)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        inv.status === "PAID" ? "default" :
                        inv.status === "PARTIALLY_PAID" ? "secondary" :
                        inv.status === "OVERDUE" ? "destructive" : "outline"
                      } className={
                        inv.status === "PAID" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" :
                        inv.status === "OVERDUE" ? "bg-red-50 text-red-700" :
                        inv.status === "SENT" ? "bg-blue-50 text-blue-700" :
                        inv.status === "PARTIALLY_PAID" ? "bg-amber-50 text-amber-700" : ""
                      }>{inv.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{inv.dueDate ? formatDate(inv.dueDate) : "-"}</td>
                  </tr>
                ))}
                {invoiceList.length === 0 && (
                  <tr><td colSpan={9} className="py-16 text-center text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p>No invoices yet</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function ExpensesContent({
  vehicles,
}: {
  vehicles: { id: string; plateNumber: string }[];
}) {
  const expenseList = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: {
      vehicle: { select: { plateNumber: true } },
      paidBy: { select: { name: true } },
      booking: { select: { bookingNumber: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">All Expenses</h2>
        <LogExpenseDialog vehicles={vehicles} />
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Description</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Vehicle</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Booking</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Paid By</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenseList.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium">{e.description}</td>
                    <td className="py-3 px-4 text-right font-medium text-red-600">{formatCurrency(e.amount)}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={
                        e.category === "FUEL" ? "bg-orange-50 text-orange-700 border-orange-200" :
                        e.category === "MAINTENANCE" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        e.category === "TOLL" ? "bg-cyan-50 text-cyan-700 border-cyan-200" :
                        "bg-gray-50 text-gray-700"
                      }>{e.category}</Badge>
                    </td>
                    <td className="py-3 px-4">{e.vehicle?.plateNumber ?? "-"}</td>
                    <td className="py-3 px-4">{e.booking?.bookingNumber ?? "-"}</td>
                    <td className="py-3 px-4">{e.paidBy?.name ?? "-"}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(e.date)}</td>
                  </tr>
                ))}
                {expenseList.length === 0 && (
                  <tr><td colSpan={7} className="py-16 text-center text-gray-400">
                    <Wallet className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p>No expenses yet</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function SettlementsContent({
  drivers,
}: {
  drivers: { id: string; name: string }[];
}) {
  const settlementList = await prisma.settlement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      driver: { select: { name: true, phone: true } },
      trip: { select: { id: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Driver Settlements</h2>
        <DriverSettlementDialog drivers={drivers} />
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Driver</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Trip</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Total Earnings</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Advance Paid</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Expenses</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Net Payable</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Created</th>
                </tr>
              </thead>
              <tbody>
                {settlementList.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium">{s.driver.name}</td>
                    <td className="py-3 px-4 font-mono text-xs">{s.trip?.id?.slice(0, 8) ?? "-"}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(s.totalEarnings)}</td>
                    <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(s.advancePaid)}</td>
                    <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(s.expenses)}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(s.netPayable)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        s.status === "PAID" ? "default" :
                        s.status === "PARTIALLY_PAID" ? "secondary" : "outline"
                      } className={
                        s.status === "PAID" ? "bg-emerald-50 text-emerald-700" :
                        s.status === "PARTIALLY_PAID" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-700"
                      }>{s.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
                {settlementList.length === 0 && (
                  <tr><td colSpan={8} className="py-16 text-center text-gray-400">
                    <UserCheck className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p>No settlements yet</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function RefundsContent() {
  const refunds = await prisma.payment.findMany({
    where: { type: "REFUND" },
    orderBy: { receivedAt: "desc" },
    include: {
      booking: { select: { bookingNumber: true } },
      customer: { select: { name: true } },
      receivedBy: { select: { name: true } },
    },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Refunds</h2>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Payment#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Booking</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Customer</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Method</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Processed By</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono text-xs">{r.paymentNumber}</td>
                    <td className="py-3 px-4">{r.booking?.bookingNumber ?? "-"}</td>
                    <td className="py-3 px-4">{r.customer?.name ?? "-"}</td>
                    <td className="py-3 px-4 text-right font-medium text-red-600">{formatCurrency(r.amount)}</td>
                    <td className="py-3 px-4"><Badge variant="secondary">{r.method}</Badge></td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(r.receivedAt)}</td>
                    <td className="py-3 px-4">{r.receivedBy?.name ?? "-"}</td>
                  </tr>
                ))}
                {refunds.length === 0 && (
                  <tr><td colSpan={7} className="py-16 text-center text-gray-400">
                    <Undo2 className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p>No refunds processed yet</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
