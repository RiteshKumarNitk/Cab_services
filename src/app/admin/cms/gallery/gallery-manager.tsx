"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createGalleryItem, deleteGalleryItem } from "@/lib/admin-cms";
import { Plus, Trash2, ImageIcon } from "lucide-react";

type GalleryData = {
  id: string;
  title: string | null;
  imageUrl: string;
  category: string;
  altText: string | null;
  sortOrder: number;
};

export function GalleryManager({ items: initial, categories }: { items: GalleryData[]; categories: string[] }) {
  const [items, setItems] = useState(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const result = await createGalleryItem(formData);
      if (result.success) {
        toast.success("Image added");
        setDialogOpen(false);
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      toast.error("Failed to add image");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      await deleteGalleryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" /> Add Image
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Gallery Image</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" name="imageUrl" placeholder="https://..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altText">Alt Text</Label>
                <Input id="altText" name="altText" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue="general">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="drivers">Drivers</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="trips">Trips</SelectItem>
                    <SelectItem value="videos">Videos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                Add Image
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="border-0 shadow-md overflow-hidden group">
            <div className="relative aspect-square">
              <img
                src={item.imageUrl}
                alt={item.altText || item.title || "Gallery image"}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setPreviewUrl(item.imageUrl)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Button
                  size="sm"
                  variant="destructive"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-2">
              <p className="text-xs text-gray-500 truncate">{item.title || item.category}</p>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p>No images in gallery yet.</p>
          </div>
        )}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          {previewUrl && <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
