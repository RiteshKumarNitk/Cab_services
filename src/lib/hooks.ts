"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// --------------- Bookings ---------------
export function useBookings(filters?: Record<string, string>) {
  const params = filters ? new URLSearchParams(filters).toString() : "";
  return useQuery({
    queryKey: ["bookings", filters],
    queryFn: () =>
      fetch(`/api/bookings${params ? `?${params}` : ""}`).then((res) =>
        res.json()
      ),
    refetchInterval: 5000,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetch(`/api/bookings/${id}`).then((res) => res.json()),
    enabled: !!id,
    refetchInterval: 3000,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking created successfully!");
    },
    onError: () => {
      toast.error("Failed to create booking");
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
      otp,
    }: {
      id: string;
      status: string;
      reason?: string;
      otp?: string;
    }) => {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason, otp }),
      });
      const data = await res.json().catch(() => ({}));
      // Surface the server's reason (invalid transition, wrong OTP, ...) instead of a false success.
      if (!res.ok) throw new Error(data.error || "Failed to update booking status");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      toast.success("Booking status updated!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update booking status");
    },
  });
}

// --------------- Drivers ---------------
export function useAvailableDrivers() {
  return useQuery({
    queryKey: ["available-drivers"],
    queryFn: () =>
      fetch("/api/drivers/available").then((res) => res.json()),
    refetchInterval: 5000,
  });
}

export function useUpdateDriverLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { lat?: number; lng?: number; online?: boolean }) =>
      fetch("/api/drivers/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-drivers"] });
    },
  });
}

// --------------- Estimate ---------------
export function useFareEstimate(params: {
  bookingType: string;
  vehicleType: string;
  distance?: number;
  duration?: number;
}) {
  const searchParams = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v ?? "")])
  );
  return useQuery({
    queryKey: ["estimate", params],
    queryFn: () =>
      fetch(`/api/estimate?${searchParams}`).then((res) => res.json()),
    enabled:
      !!params.bookingType && !!params.vehicleType,
  });
}

// --------------- Admin ---------------
export function useAdminUsers() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetch("/api/admin/users").then((res) => res.json()),
    enabled: session?.user?.role === "ADMIN",
  });
}

export function useAdminVehicles() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["admin-vehicles"],
    queryFn: () => fetch("/api/admin/vehicles").then((res) => res.json()),
    enabled: session?.user?.role === "ADMIN",
  });
}

export function useAdminPricing() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["admin-pricing"],
    queryFn: () => fetch("/api/admin/pricing").then((res) => res.json()),
    enabled: session?.user?.role === "ADMIN",
  });
}

export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) =>
      fetch(`/api/admin/payments/${bookingId}`, {
        method: "PUT",
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Payment marked as paid!");
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User created successfully!");
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) =>
      fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated successfully!");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/users/${id}`, { method: "DELETE" }).then((res) =>
        res.json()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted successfully!");
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      toast.success("Vehicle created successfully!");
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) =>
      fetch(`/api/admin/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      toast.success("Vehicle updated successfully!");
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/vehicles/${id}`, { method: "DELETE" }).then((res) =>
        res.json()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      toast.success("Vehicle deleted successfully!");
    },
  });
}

export function useUpdatePricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      vehicleType,
      data,
    }: {
      vehicleType: string;
      data: Record<string, unknown>;
    }) =>
      fetch(`/api/admin/pricing/${vehicleType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing"] });
      toast.success("Pricing updated successfully!");
    },
  });
}

// --------------- Ratings ---------------
export function useCreateRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      bookingId: string;
      driverId: string;
      score: number;
      comment?: string;
    }) =>
      fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Rating submitted!");
    },
  });
}
