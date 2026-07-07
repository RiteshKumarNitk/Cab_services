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
import { createBlogPost, updateBlogPost, deleteBlogPost } from "@/lib/admin-cms";
import { Plus, Pencil, Trash2, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";

type BlogData = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  featuredImage: string | null;
  shortDesc: string;
  content: string;
  author: string | null;
  publishedDate: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  metaKeywords: string | null;
  status: string;
  featured: boolean;
};

export function BlogsManager({ posts: initial }: { posts: BlogData[] }) {
  const [posts, setPosts] = useState(initial);
  const [editPost, setEditPost] = useState<BlogData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const result = await createBlogPost(formData);
      if (result.success) {
        toast.success("Blog post created");
        setDialogOpen(false);
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      toast.error("Failed to create blog post");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editPost) return;
    const formData = new FormData(e.currentTarget);
    try {
      const result = await updateBlogPost(editPost.id, formData);
      if (result.success) {
        toast.success("Blog post updated");
        setEditPost(null);
        setDialogOpen(false);
      }
    } catch {
      toast.error("Failed to update blog post");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    try {
      await deleteBlogPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Blog post deleted");
    } catch {
      toast.error("Failed to delete blog post");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (open) setEditPost(null);
          }}
        >
          <DialogTrigger
            render={
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" /> Create Blog Post
              </Button>
            }
          />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editPost ? "Edit Blog Post" : "Create Blog Post"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={editPost ? handleUpdate : handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={editPost?.title || ""} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" defaultValue={editPost?.slug || ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" defaultValue={editPost?.category || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input id="featuredImage" name="featuredImage" defaultValue={editPost?.featuredImage || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortDesc">Short Description</Label>
                <Textarea id="shortDesc" name="shortDesc" defaultValue={editPost?.shortDesc || ""} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content (HTML)</Label>
                <Textarea id="content" name="content" defaultValue={editPost?.content || ""} rows={10} className="font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input id="author" name="author" defaultValue={editPost?.author || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publishedDate">Published Date</Label>
                  <Input id="publishedDate" name="publishedDate" type="date" defaultValue={editPost?.publishedDate?.split("T")[0] || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select name="status" defaultValue={editPost?.status || "DRAFT"} className="w-full p-2 border rounded">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="featured" name="featured" defaultChecked={editPost?.featured || false} />
                <Label htmlFor="featured">Featured Post</Label>
              </div>
              <details className="border rounded-lg p-4">
                <summary className="text-sm font-medium cursor-pointer">SEO Settings</summary>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input id="metaTitle" name="metaTitle" defaultValue={editPost?.metaTitle || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaDesc">Meta Description</Label>
                    <Textarea id="metaDesc" name="metaDesc" defaultValue={editPost?.metaDesc || ""} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaKeywords">Meta Keywords</Label>
                    <Input id="metaKeywords" name="metaKeywords" defaultValue={editPost?.metaKeywords || ""} />
                  </div>
                </div>
              </details>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                {editPost ? "Update Blog Post" : "Create Blog Post"}
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
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Featured</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{post.title}</div>
                    <div className="text-xs text-gray-500">/{post.slug}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      post.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}>{post.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    {post.featured ? <span className="text-amber-500 text-xs font-medium">Featured</span> : "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {post.publishedDate ? new Date(post.publishedDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Button size="sm" variant="ghost"><Eye className="h-3.5 w-3.5" /></Button>
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => { setEditPost(post); setDialogOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <p>No blog posts yet.</p>
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
