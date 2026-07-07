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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createFAQ, updateFAQ, deleteFAQ } from "@/lib/admin-cms";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

type FAQData = {
  id: string;
  question: string;
  answer: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  sortOrder: number;
  status: string;
  searchEnabled: boolean;
  showOnHomepage: boolean;
  showOnFAQPage: boolean;
};

type CategoryData = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export function FAQsManager({
  faqs: initial,
  categories,
}: {
  faqs: FAQData[];
  categories: CategoryData[];
}) {
  const [faqs, setFaqs] = useState(initial);
  const [editFaq, setEditFaq] = useState<FAQData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const result = await createFAQ(formData);
      if (result.success) {
        toast.success("FAQ created");
        setDialogOpen(false);
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      toast.error("Failed to create FAQ");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editFaq) return;
    const formData = new FormData(e.currentTarget);
    try {
      const result = await updateFAQ(editFaq.id, formData);
      if (result.success) {
        toast.success("FAQ updated");
        setEditFaq(null);
        setDialogOpen(false);
      }
    } catch {
      toast.error("Failed to update FAQ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await deleteFAQ(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      toast.success("FAQ deleted");
    } catch {
      toast.error("Failed to delete FAQ");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (open) setEditFaq(null);
          }}
        >
          <DialogTrigger
            render={
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" /> Add FAQ
              </Button>
            }
          />
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={editFaq ? handleUpdate : handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input id="question" name="question" defaultValue={editFaq?.question || ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea id="answer" name="answer" defaultValue={editFaq?.answer || ""} rows={4} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <Select name="categoryId" defaultValue={editFaq?.categoryId || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input id="sortOrder" name="sortOrder" type="number" defaultValue={editFaq?.sortOrder || 0} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="showOnHomepage" name="showOnHomepage" defaultChecked={editFaq?.showOnHomepage || false} />
                  <Label htmlFor="showOnHomepage">Show on Homepage</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="showOnFAQPage" name="showOnFAQPage" defaultChecked={editFaq?.showOnFAQPage ?? true} />
                  <Label htmlFor="showOnFAQPage">Show on FAQ Page</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editFaq?.status || "ACTIVE"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                {editFaq ? "Update FAQ" : "Create FAQ"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0 divide-y divide-gray-100">
          {faqs.map((faq) => (
            <div key={faq.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <button
                  onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
                  className="flex items-start gap-2 text-left flex-1"
                >
                  {expanded === faq.id ? (
                    <ChevronDown className="h-5 w-5 mt-0.5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 mt-0.5 text-gray-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {faq.category && (
                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {faq.category.name}
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { setEditFaq(faq); setDialogOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(faq.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {expanded === faq.id && (
                <div className="mt-3 ml-7 text-sm text-gray-600">{faq.answer}</div>
              )}
            </div>
          ))}
          {faqs.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <p>No FAQs yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
