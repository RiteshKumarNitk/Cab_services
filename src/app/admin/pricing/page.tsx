"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAdminPricing, useUpdatePricing } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Save } from "lucide-react";

interface PricingForm extends Record<string, string> {
  baseFare: string;
  perKm: string;
  perMinute: string;
  eventMin: string;
  eventMax: string;
}

export default function AdminPricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: pricing, isLoading } = useAdminPricing();
  const updatePricing = useUpdatePricing();

  const [forms, setForms] = useState<Record<string, PricingForm>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const formsInitialized = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (Array.isArray(pricing) && !formsInitialized.current) {
      const newForms: Record<string, PricingForm> = {};
      for (const p of pricing) {
        newForms[p.vehicleType] = {
          baseFare: String(p.baseFare),
          perKm: String(p.perKm),
          perMinute: String(p.perMinute),
          eventMin: String(p.eventMin),
          eventMax: String(p.eventMax),
        };
      }
      setForms(newForms);
      formsInitialized.current = true;
    }
  }, [pricing]);

  const handleSave = async (vehicleType: string) => {
    setSaving({ ...saving, [vehicleType]: true });
    await updatePricing.mutateAsync({
      vehicleType,
      data: forms[vehicleType],
    });
    setSaving({ ...saving, [vehicleType]: false });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const vehicleTypes = [
    { key: "SEDAN", label: "Sedan" },
    { key: "SUV", label: "SUV" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Pricing Configuration
        </h1>
        <p className="text-gray-500 mt-1">
          Set fare components for each vehicle type
        </p>
      </div>

      <div className="space-y-6">
        {vehicleTypes.map(({ key, label }) => {
          const form = forms[key] || {
            baseFare: "0",
            perKm: "0",
            perMinute: "0",
            eventMin: "0",
            eventMax: "0",
          };

          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  {label} Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Per-Km Pricing */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Local / Outstation / Airport
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Base Fare (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.baseFare}
                        onChange={(e) =>
                          setForms({
                            ...forms,
                            [key]: { ...form, baseFare: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Per Km (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.perKm}
                        onChange={(e) =>
                          setForms({
                            ...forms,
                            [key]: { ...form, perKm: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Per Minute (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.perMinute}
                        onChange={(e) =>
                          setForms({
                            ...forms,
                            [key]: { ...form, perMinute: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Event Pricing */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Event Packages
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.eventMin}
                        onChange={(e) =>
                          setForms({
                            ...forms,
                            [key]: { ...form, eventMin: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.eventMax}
                        onChange={(e) =>
                          setForms({
                            ...forms,
                            [key]: { ...form, eventMax: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Example calculation */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Example Calculation
                  </h4>
                  <p className="text-sm text-gray-600">
                    For a 10km {label} ride: Base ₹
                    {parseFloat(form.baseFare).toFixed(0)} + 10km × ₹
                    {parseFloat(form.perKm).toFixed(0)} ={" "}
                    {formatCurrency(
                      parseFloat(form.baseFare) + 10 * parseFloat(form.perKm)
                    )}
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleSave(key)}
                  disabled={saving[key]}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving[key] ? "Saving..." : `Save ${label} Pricing`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
