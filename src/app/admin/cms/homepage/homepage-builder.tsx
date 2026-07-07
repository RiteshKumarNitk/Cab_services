"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { saveHomepageSection, deleteHomepageSection } from "@/lib/admin-cms";
import { Plus, Pencil, Trash2, Eye, GripVertical, EyeOff, Layout } from "lucide-react";

type SectionData = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  content: string;
  image: string | null;
  video: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  ctaSecondaryText: string | null;
  ctaSecondaryLink: string | null;
  sortOrder: number;
  isEnabled: boolean;
};

const SECTION_TYPES = [
  { value: "hero", label: "Hero Banner" },
  { value: "trusted", label: "Trusted Companies" },
  { value: "stats", label: "Statistics" },
  { value: "why_choose_us", label: "Why Choose Us" },
  { value: "services", label: "Our Services" },
  { value: "routes", label: "Popular Routes" },
  { value: "fleet", label: "Fleet Section" },
  { value: "pricing", label: "Pricing Highlights" },
  { value: "testimonials", label: "Testimonials" },
  { value: "gallery", label: "Gallery" },
  { value: "faq", label: "FAQs" },
  { value: "blogs", label: "Latest Blogs" },
  { value: "cta", label: "Contact CTA" },
  { value: "footer_cta", label: "Footer CTA" },
];

export function HomepageBuilder({ sections: initial }: { sections: SectionData[] }) {
  const [sections, setSections] = useState(initial);
  const [editSection, setEditSection] = useState<SectionData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = editSection?.id || null;
    try {
      const result = await saveHomepageSection(id, formData);
      if (result.success) {
        toast.success(editSection ? "Section updated" : "Section created");
        setDialogOpen(false);
        setEditSection(null);
      }
    } catch {
      toast.error("Failed to save section");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this section?")) return;
    try {
      await deleteHomepageSection(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      toast.success("Section deleted");
    } catch {
      toast.error("Failed to delete section");
    }
  };

  const openCreate = () => {
    setEditSection(null);
    setDialogOpen(true);
  };

  const openEdit = (s: SectionData) => {
    setEditSection(s);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => { setDialogOpen(open); if (open) setEditSection(null); }}
        >
          <DialogTrigger
            render={<Button className="bg-amber-600 hover:bg-amber-700"><Plus className="h-4 w-4 mr-2" /> Add Section</Button>}
          />
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editSection ? "Edit Section" : "Add Section"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Section Type</Label>
                <Select name="type" defaultValue={editSection?.type || "hero"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((st) => (
                      <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={editSection?.title || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input id="subtitle" name="subtitle" defaultValue={editSection?.subtitle || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content (JSON or HTML)</Label>
                <Textarea id="content" name="content" defaultValue={editSection?.content || "{}"} rows={5} className="font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Background Image URL</Label>
                  <Input id="image" name="image" defaultValue={editSection?.image || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video">Background Video URL</Label>
                  <Input id="video" name="video" defaultValue={editSection?.video || ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ctaText">CTA Button Text</Label>
                  <Input id="ctaText" name="ctaText" defaultValue={editSection?.ctaText || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaLink">CTA Button Link</Label>
                  <Input id="ctaLink" name="ctaLink" defaultValue={editSection?.ctaLink || ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ctaSecondaryText">Secondary CTA Text</Label>
                  <Input id="ctaSecondaryText" name="ctaSecondaryText" defaultValue={editSection?.ctaSecondaryText || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaSecondaryLink">Secondary CTA Link</Label>
                  <Input id="ctaSecondaryLink" name="ctaSecondaryLink" defaultValue={editSection?.ctaSecondaryLink || ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input id="sortOrder" name="sortOrder" type="number" defaultValue={editSection?.sortOrder || 0} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch id="isEnabled" name="isEnabled" defaultChecked={editSection?.isEnabled ?? true} />
                  <Label htmlFor="isEnabled">Enabled</Label>
                </div>
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                {editSection ? "Update Section" : "Create Section"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <Card key={section.id} className="border-0 shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-gray-300 cursor-move" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{section.title || SECTION_TYPES.find(st => st.value === section.type)?.label || section.type}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{SECTION_TYPES.find(st => st.value === section.type)?.label || section.type}</span>
                    {!section.isEnabled && <EyeOff className="h-4 w-4 text-gray-400" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Order: {section.sortOrder}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(section)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(section.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {sections.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Layout className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p>No homepage sections yet. Add your first section.</p>
          </div>
        )}
      </div>
    </div>
  );
}
