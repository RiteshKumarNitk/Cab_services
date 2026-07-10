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
  formatDateTime,
  getBookingTypeName,
} from "@/lib/utils";
import {
  AlertTriangle,
  PlusCircle,
  MapPin,
  Camera,
  Loader2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

const INCIDENT_TYPES = [
  { value: "ACCIDENT", label: "Accident", color: "text-red-600" },
  { value: "BREAKDOWN", label: "Breakdown", color: "text-orange-600" },
  { value: "DELAY", label: "Delay", color: "text-yellow-600" },
  { value: "OTHER", label: "Other", color: "text-gray-600" },
];

interface IncidentItem {
  id: string;
  type: string;
  description: string | null;
  location: string | null;
  images: string;
  status: string;
  trip: { tripNumber: string } | null;
  booking: { bookingNumber: string } | null;
  createdAt: string;
}

export default function DriverIncidentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  const { data: bookings, isLoading: bookingsLoading } = useBookings();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "DRIVER") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await fetch("/api/driver/incidents");
      if (res.ok) {
        const data = await res.json();
        setIncidents(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Failed to load incidents");
    } finally {
      setLoadingIncidents(false);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);
    const previews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === files.length) {
          setImagePreviews((prev) => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const totalPreviews = [...imagePreviews];
    const totalFiles = [...imageFiles];
    totalPreviews.splice(index, 1);
    totalFiles.splice(index, 1);
    setImagePreviews(totalPreviews);
    setImageFiles(totalFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      toast.error("Incident type is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/driver/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description,
          location,
          images: imagePreviews,
          bookingId: bookingId || null,
        }),
      });

      if (res.ok) {
        toast.success("Incident reported successfully");
        setType("");
        setDescription("");
        setLocation("");
        setBookingId("");
        setImageFiles([]);
        setImagePreviews([]);
        fetchIncidents();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to report incident");
      }
    } catch {
      toast.error("Failed to report incident");
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
        <h1 className="text-2xl font-bold text-gray-900">Report Incident</h1>
        <p className="text-gray-500 mt-1">Report accidents, breakdowns, or delays</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                New Incident Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="incident-type">Incident Type *</Label>
                  <Select value={type} onValueChange={(value) => setType(value ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.map((it) => (
                        <SelectItem key={it.value} value={it.value}>
                          <span className={it.color}>{it.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what happened..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10"
                      placeholder="Where did it happen?"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="booking-select">Related Trip (optional)</Label>
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
                  <Label>Images (optional)</Label>
                  <div>
                    <Label
                      htmlFor="images-upload"
                      className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50 text-gray-500"
                    >
                      <Camera className="h-6 w-6" />
                      <span className="text-sm">Click to upload images</span>
                    </Label>
                    <Input
                      id="images-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      className="hidden"
                    />
                  </div>
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {imagePreviews.map((preview, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={preview}
                            alt={`Upload ${i + 1}`}
                            className="h-20 w-full object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 mr-2" />
                  )}
                  {submitting ? "Submitting..." : "Report Incident"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Previous Reports */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Previous Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingIncidents ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : incidents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No incidents reported</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={
                            incident.status === "REPORTED"
                              ? "destructive"
                              : incident.status === "REVIEWING"
                              ? "secondary"
                              : "default"
                          }
                          className="text-xs"
                        >
                          {incident.status}
                        </Badge>
                        <span className="text-xs font-medium text-gray-700">
                          {incident.type}
                        </span>
                      </div>
                      {incident.description && (
                        <p className="text-xs text-gray-600 mb-1">{incident.description}</p>
                      )}
                      {incident.location && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {incident.location}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(incident.createdAt)}
                        </span>
                        {incident.booking && (
                          <span>#{incident.booking.bookingNumber}</span>
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
