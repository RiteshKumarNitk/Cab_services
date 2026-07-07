"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createTestimonial, updateTestimonial, deleteTestimonial } from "@/lib/admin-cms";
import { Plus, Pencil, Trash2, Star } from "lucide-react";

type TestimonialData = {
  id: string;
  customerName: string;
  photo: string | null;
  city: string | null;
  vehicleUsed: string | null;
  rating: number;
  review: string;
  displayOrder: number;
  status: string;
  featured: boolean;
};

export function TestimonialsManager({ testimonials: initial }: { testimonials: TestimonialData[] }) {
  const [testimonials, setTestimonials] = useState(initial);
  const [editItem, setEditItem] = useState<TestimonialData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const result = await createTestimonial(formData);
      if (result.success) {
        toast.success("Testimonial created");
        setDialogOpen(false);
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      toast.error("Failed to create testimonial");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editItem) return;
    const formData = new FormData(e.currentTarget);
    try {
      const result = await updateTestimonial(editItem.id, formData);
      if (result.success) {
        toast.success("Testimonial updated");
        setEditItem(null);
        setDialogOpen(false);
      }
    } catch {
      toast.error("Failed to update testimonial");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    try {
      await deleteTestimonial(id);
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      toast.success("Testimonial deleted");
    } catch {
      toast.error("Failed to delete testimonial");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (open) setEditItem(null);
          }}
        >
          <DialogTrigger
            render={
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" /> Add Testimonial
              </Button>
            }
          />
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={editItem ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input id="customerName" name="customerName" defaultValue={editItem?.customerName || ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" defaultValue={editItem?.city || ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleUsed">Vehicle Used</Label>
                  <Input id="vehicleUsed" name="vehicleUsed" defaultValue={editItem?.vehicleUsed || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Input id="rating" name="rating" type="number" min={1} max={5} defaultValue={editItem?.rating || 5} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Photo URL</Label>
                <Input id="photo" name="photo" defaultValue={editItem?.photo || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review">Review</Label>
                <Textarea id="review" name="review" defaultValue={editItem?.review || ""} rows={4} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input id="displayOrder" name="displayOrder" type="number" defaultValue={editItem?.displayOrder || 0} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch id="featured" name="featured" defaultChecked={editItem?.featured || false} />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select name="status" defaultValue={editItem?.status || "ACTIVE"} className="w-full p-2 border rounded">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                {editItem ? "Update Testimonial" : "Create Testimonial"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Featured</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{t.customerName}</div>
                    {t.city && <div className="text-xs text-gray-500">{t.city}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}>{t.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    {t.featured ? (
                      <span className="text-amber-500 text-xs font-medium">Featured</span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setEditItem(t); setDialogOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {testimonials.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <p>No testimonials yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
