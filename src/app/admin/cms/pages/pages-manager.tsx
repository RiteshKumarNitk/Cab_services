"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  createStaticPage,
  updateStaticPage,
  deleteStaticPage,
} from "@/lib/admin-cms";
import { Plus, Pencil, Trash2, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";

type PageData = {
  id: string;
  title: string;
  slug: string;
  bannerImage: string | null;
  content: string;
  metaTitle: string | null;
  metaDesc: string | null;
  metaKeywords: string | null;
  status: string;
  showInMenu: boolean;
  showInFooter: boolean;
  sortOrder: number;
};

export function PagesManager({ pages: initial }: { pages: PageData[] }) {
  const [pages, setPages] = useState(initial);
  const [editPage, setEditPage] = useState<PageData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const result = await createStaticPage(formData);
      if (result.success) {
        toast.success("Page created");
        setDialogOpen(false);
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      toast.error("Failed to create page");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editPage) return;
    const formData = new FormData(e.currentTarget);
    try {
      const result = await updateStaticPage(editPage.id, formData);
      if (result.success) {
        toast.success("Page updated");
        setEditPage(null);
        setDialogOpen(false);
      }
    } catch {
      toast.error("Failed to update page");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this page permanently?")) return;
    try {
      await deleteStaticPage(id);
      setPages((prev) => prev.filter((p) => p.id !== id));
      toast.success("Page deleted");
    } catch {
      toast.error("Failed to delete page");
    }
  };

  const openEdit = (page: PageData) => {
    setEditPage(page);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditPage(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (open) setEditPage(null);
          }}
        >
          <DialogTrigger
            render={
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" /> Create Page
              </Button>
            }
          />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editPage ? "Edit Page" : "Create Page"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={editPage ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editPage?.title || ""}
                    placeholder="e.g. About Us"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={editPage?.slug || ""}
                    placeholder="e.g. about-us"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bannerImage">Banner Image URL</Label>
                <Input
                  id="bannerImage"
                  name="bannerImage"
                  defaultValue={editPage?.bannerImage || ""}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content (HTML)</Label>
                <Textarea
                  id="content"
                  name="content"
                  defaultValue={editPage?.content || ""}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editPage?.status || "DRAFT"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="showInMenu"
                    name="showInMenu"
                    defaultChecked={editPage?.showInMenu || false}
                  />
                  <Label htmlFor="showInMenu">Show in Menu</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="showInFooter"
                    name="showInFooter"
                    defaultChecked={editPage?.showInFooter || false}
                  />
                  <Label htmlFor="showInFooter">Show in Footer</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  defaultValue={editPage?.sortOrder || 0}
                />
              </div>

              <details className="border rounded-lg p-4">
                <summary className="text-sm font-medium cursor-pointer">SEO Settings</summary>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      name="metaTitle"
                      defaultValue={editPage?.metaTitle || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaDesc">Meta Description</Label>
                    <Textarea
                      id="metaDesc"
                      name="metaDesc"
                      defaultValue={editPage?.metaDesc || ""}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaKeywords">Meta Keywords</Label>
                    <Input
                      id="metaKeywords"
                      name="metaKeywords"
                      defaultValue={editPage?.metaKeywords || ""}
                    />
                  </div>
                </div>
              </details>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                {editPage ? "Update Page" : "Create Page"}
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
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Menu</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{page.title}</td>
                  <td className="py-3 px-4 text-gray-500 text-sm">/{page.slug}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        page.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 text-xs">
                      {page.showInMenu && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Menu</span>
                      )}
                      {page.showInFooter && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Footer</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/${page.slug}`} target="_blank">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(page)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => handleDelete(page.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <p>No pages yet. Create your first page.</p>
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
