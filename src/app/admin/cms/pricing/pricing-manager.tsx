"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { savePricing, savePricingPage } from "@/lib/admin-cms";
import { Save, Loader2 } from "lucide-react";

type PricingEntry = {
  id: string;
  vehicleType: string;
  baseFare: number;
  perKm: number;
  perMinute: number;
  minKm: number;
  nightCharge: number;
  driverCharge: number;
  waitingCharge: number;
  eventMin: number;
  eventMax: number;
  monthlyMin: number;
  monthlyMax: number;
};

type PricingPageData = {
  id: string;
  content: string;
  parkingPolicy: string;
  tollPolicy: string;
  stateTaxPolicy: string;
  cancellationPolicy: string;
  refundPolicy: string;
  gstPercentage: number;
  seasonalPricing: string;
  specialOffers: string;
} | null;

export function PricingManager({
  pricingEntries: initial,
  pricingPage: initialPage,
  vehicleTypes,
}: {
  pricingEntries: PricingEntry[];
  pricingPage: PricingPageData;
  vehicleTypes: string[];
}) {
  const [pricingEntries, setPricingEntries] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);

  const handleSavePricing = async (vehicleType: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(vehicleType);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await savePricing(vehicleType, formData);
      if (result.success) toast.success(`${vehicleType} pricing saved`);
    } catch {
      toast.error("Failed to save pricing");
    } finally {
      setSaving(null);
    }
  };

  const handleSavePage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving("page");
    const formData = new FormData(e.currentTarget);
    try {
      const result = await savePricingPage(formData);
      if (result.success) toast.success("Pricing page saved");
    } catch {
      toast.error("Failed to save pricing page");
    } finally {
      setSaving(null);
    }
  };

  const getEntry = (vt: string) => pricingEntries.find((e) => e.vehicleType === vt);

  return (
    <Tabs defaultValue="rates" className="mb-8">
      <TabsList className="mb-6">
        <TabsTrigger value="rates">Per-Vehicle Rates</TabsTrigger>
        <TabsTrigger value="policies">Policies & Page Content</TabsTrigger>
      </TabsList>

      <TabsContent value="rates">
        <div className="space-y-6">
          {vehicleTypes.map((vt) => {
            const entry = getEntry(vt);
            return (
              <Card key={vt} className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{vt.toLowerCase().replace("_", " ")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => handleSavePricing(vt, e)} className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Base Rates</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { key: "baseFare", label: "Base Fare (₹)" },
                          { key: "perKm", label: "Per Km (₹)" },
                          { key: "perMinute", label: "Per Minute (₹)" },
                          { key: "minKm", label: "Min KM" },
                        ].map((f) => (
                          <div key={f.key} className="space-y-1">
                            <Label className="text-xs">{f.label}</Label>
                            <Input name={f.key} type="number" step="0.01" defaultValue={(entry as any)?.[f.key] ?? 0} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Charges</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                          { key: "nightCharge", label: "Night Charge (₹)" },
                          { key: "driverCharge", label: "Driver Charge (₹)" },
                          { key: "waitingCharge", label: "Waiting Charge (₹)" },
                        ].map((f) => (
                          <div key={f.key} className="space-y-1">
                            <Label className="text-xs">{f.label}</Label>
                            <Input name={f.key} type="number" step="0.01" defaultValue={(entry as any)?.[f.key] ?? 0} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Packages</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { key: "eventMin", label: "Event Min (₹)" },
                          { key: "eventMax", label: "Event Max (₹)" },
                          { key: "monthlyMin", label: "Monthly Min (₹)" },
                          { key: "monthlyMax", label: "Monthly Max (₹)" },
                        ].map((f) => (
                          <div key={f.key} className="space-y-1">
                            <Label className="text-xs">{f.label}</Label>
                            <Input name={f.key} type="number" step="0.01" defaultValue={(entry as any)?.[f.key] ?? 0} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" disabled={saving === vt} className="bg-amber-600 hover:bg-amber-700">
                      {saving === vt ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Pricing</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="policies">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Pricing Page Content & Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePage} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="content">Page Introduction (HTML)</Label>
                <Textarea id="content" name="content" defaultValue={initialPage?.content || ""} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parkingPolicy">Parking Policy</Label>
                  <Textarea id="parkingPolicy" name="parkingPolicy" defaultValue={initialPage?.parkingPolicy || ""} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tollPolicy">Toll Policy</Label>
                  <Textarea id="tollPolicy" name="tollPolicy" defaultValue={initialPage?.tollPolicy || ""} rows={3} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stateTaxPolicy">State Tax Policy</Label>
                  <Textarea id="stateTaxPolicy" name="stateTaxPolicy" defaultValue={initialPage?.stateTaxPolicy || ""} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                  <Textarea id="cancellationPolicy" name="cancellationPolicy" defaultValue={initialPage?.cancellationPolicy || ""} rows={3} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="refundPolicy">Refund Policy</Label>
                  <Textarea id="refundPolicy" name="refundPolicy" defaultValue={initialPage?.refundPolicy || ""} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstPercentage">GST Percentage (%)</Label>
                  <Input id="gstPercentage" name="gstPercentage" type="number" step="0.1" defaultValue={initialPage?.gstPercentage || 5} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seasonalPricing">Seasonal Pricing</Label>
                  <Textarea id="seasonalPricing" name="seasonalPricing" defaultValue={initialPage?.seasonalPricing || ""} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialOffers">Special Offers</Label>
                  <Textarea id="specialOffers" name="specialOffers" defaultValue={initialPage?.specialOffers || ""} rows={3} />
                </div>
              </div>
              <Button type="submit" disabled={saving === "page"} className="bg-amber-600 hover:bg-amber-700">
                {saving === "page" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Page Content</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
