"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBookings } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency,
  formatDateTime,
  getBookingTypeName,
} from "@/lib/utils";
import {
  DollarSign,
  PlusCircle,
  Receipt,
  Fuel,
  MapPin,
  CalendarCheck,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  { value: "FUEL", label: "Fuel", icon: Fuel },
  { value: "TOLL", label: "Toll", icon: MapPin },
  { value: "PARKING", label: "Parking", icon: MapPin },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OTHER", label: "Other" },
];

export default function DriverExpensesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  const { data: bookings, isLoading: bookingsLoading } = useBookings();

  interface ExpenseItem {
    id: string;
    amount: number;
    category: string;
    description: string;
    receiptUrl: string | null;
    trip: { tripNumber: string } | null;
    booking: { bookingNumber: string } | null;
    createdAt: string;
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "DRIVER") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/driver/expenses");
      if (res.ok) {
        const data = await res.json();
        setExpenses(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoadingExpenses(false);
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) {
      toast.error("Amount and category are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/driver/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          description,
          receiptUrl: receiptPreview || null,
          bookingId: bookingId || null,
        }),
      });

      if (res.ok) {
        toast.success("Expense logged successfully");
        setAmount("");
        setCategory("");
        setDescription("");
        setBookingId("");
        setReceiptFile(null);
        setReceiptPreview("");
        fetchExpenses();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to log expense");
      }
    } catch {
      toast.error("Failed to log expense");
    } finally {
      setSubmitting(false);
    }
  };

  const bookingsList = Array.isArray(bookings) ? bookings : [];

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Log Expense</h1>
        <p className="text-gray-500 mt-1">Record trip-related expenses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                New Expense
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-7"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={(value) => setCategory(value ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="booking-select">Link to Trip (optional)</Label>
                  <Select value={bookingId} onValueChange={(value) => setBookingId(value ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a trip" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {bookingsList.map((b: { id: string; bookingType: string; pickupAddress: string; createdAt: string }) => (
                        <SelectItem key={b.id} value={b.id}>
                          {getBookingTypeName(b.bookingType)} — {b.pickupAddress?.slice(0, 30)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt">Receipt (optional)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="receipt"
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptChange}
                      className="flex-1"
                    />
                    {receiptPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReceiptFile(null);
                          setReceiptPreview("");
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {receiptPreview && (
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="mt-2 max-h-32 rounded border object-contain"
                    />
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4 mr-2" />
                  )}
                  {submitting ? "Submitting..." : "Log Expense"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recent Expenses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Recent Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingExpenses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No expenses logged yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.slice(0, 10).map((expense) => (
                    <div key={expense.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline" className="text-xs">
                          {expense.category}
                        </Badge>
                        <span className="font-semibold text-sm">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>
                      {expense.description && (
                        <p className="text-xs text-gray-600 mt-1">{expense.description}</p>
                      )}
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                        <span>{formatDateTime(expense.createdAt)}</span>
                        {expense.booking && (
                          <span>#{expense.booking.bookingNumber}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
