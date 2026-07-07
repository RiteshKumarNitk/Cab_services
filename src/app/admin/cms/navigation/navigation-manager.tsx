"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  createNavigation,
  deleteNavigation,
  createNavItem,
  deleteNavItem,
  updateNavItem,
} from "@/lib/admin-cms";
import { Plus, Trash2, GripVertical, ExternalLink } from "lucide-react";

type NavItemData = {
  id: string;
  label: string;
  url: string;
  parentId: string | null;
  target: string;
  sortOrder: number;
  isActive: boolean;
  children?: NavItemData[];
};

type NavigationData = {
  id: string;
  name: string;
  slug: string;
  location: string;
  sortOrder: number;
  isActive: boolean;
  items: NavItemData[];
};

export function NavigationManager({
  navigations: initial,
}: {
  navigations: NavigationData[];
}) {
  const [navigations, setNavigations] = useState(initial);
  const [newNavOpen, setNewNavOpen] = useState(false);
  const [newItemOpen, setNewItemOpen] = useState<string | null>(null);

  const handleCreateNav = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await createNavigation(formData);
      if (result.success) {
        toast.success("Navigation created");
        setNewNavOpen(false);
        form.reset();
      }
    } catch {
      toast.error("Failed to create navigation");
    }
  };

  const handleDeleteNav = async (id: string) => {
    if (!confirm("Delete this navigation and all its items?")) return;
    try {
      await deleteNavigation(id);
      setNavigations((prev) => prev.filter((n) => n.id !== id));
      toast.success("Navigation deleted");
    } catch {
      toast.error("Failed to delete navigation");
    }
  };

  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await createNavItem(formData);
      if (result.success) {
        toast.success("Menu item added");
        setNewItemOpen(null);
      }
    } catch {
      toast.error("Failed to add menu item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      await deleteNavItem(id);
      toast.success("Menu item deleted");
    } catch {
      toast.error("Failed to delete menu item");
    }
  };

  const renderNavItems = (items: NavItemData[], depth = 0) => (
    <ul className={`space-y-1 ${depth > 0 ? "ml-6 border-l-2 border-gray-100 pl-4" : ""}`}>
      {items
        .filter((i) => i.isActive !== false)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => (
          <li key={item.id} className="group">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-sm">
              <div className="flex items-center gap-2">
                <GripVertical className="h-3.5 w-3.5 text-gray-300" />
                <span className="font-medium">{item.label}</span>
                <span className="text-gray-400 text-xs">({item.url})</span>
                {item.target === "_blank" && (
                  <ExternalLink className="h-3 w-3 text-gray-400" />
                )}
              </div>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {item.children && renderNavItems(item.children, depth + 1)}
          </li>
        ))}
    </ul>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={newNavOpen} onOpenChange={setNewNavOpen}>
          <DialogTrigger
            render={
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" /> Add Navigation Menu
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Navigation Menu</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateNav} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Menu Name</Label>
                <Input id="name" name="name" placeholder="e.g. Main Menu" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" placeholder="e.g. main-menu" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select name="location" defaultValue="HEADER">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HEADER">Header</SelectItem>
                    <SelectItem value="FOOTER">Footer</SelectItem>
                    <SelectItem value="SIDEBAR">Sidebar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                Create Menu
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {navigations.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-gray-400">
            <p>No navigation menus yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        navigations.map((nav) => (
          <Card key={nav.id} className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg capitalize">{nav.name}</CardTitle>
                <p className="text-sm text-gray-500">
                  {nav.location.toLowerCase()} &middot; {nav.items.length} items
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Dialog
                  open={newItemOpen === nav.id}
                  onOpenChange={(open) => setNewItemOpen(open ? nav.id : null)}
                >
                  <DialogTrigger
                    render={
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Menu Item to {nav.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateItem} className="space-y-4">
                      <input type="hidden" name="navigationId" value={nav.id} />
                      <div className="space-y-2">
                        <Label htmlFor="label">Label</Label>
                        <Input id="label" name="label" placeholder="e.g. About Us" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="url">URL</Label>
                        <Input id="url" name="url" placeholder="e.g. /about or https://..." required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parentId">Parent Item (for dropdown)</Label>
                        <Select name="parentId">
                          <SelectTrigger>
                            <SelectValue placeholder="None (top level)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None (Top Level)</SelectItem>
                            {nav.items.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target">Open in</Label>
                        <Select name="target" defaultValue="_self">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_self">Same Tab</SelectItem>
                            <SelectItem value="_blank">New Tab</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                        Add Item
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteNav(nav.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {nav.items.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  No items yet. Click &quot;Add Item&quot; to add menu items.
                </p>
              ) : (
                renderNavItems(nav.items)
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
