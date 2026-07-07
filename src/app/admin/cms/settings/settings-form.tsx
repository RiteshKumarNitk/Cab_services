"use client";

import { useState } from "react";
import { saveWebsiteSettings } from "@/lib/admin-cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2 } from "lucide-react";

const SETTINGS_GROUPS = [
  {
    id: "general",
    label: "General",
    fields: [
      { key: "company_name", label: "Company Name", type: "text" },
      { key: "company_logo", label: "Company Logo URL", type: "text" },
      { key: "favicon", label: "Favicon URL", type: "text" },
      { key: "company_description", label: "Company Description", type: "textarea" },
    ],
  },
  {
    id: "contact",
    label: "Contact Info",
    fields: [
      { key: "phone_primary", label: "Primary Phone", type: "text" },
      { key: "phone_secondary", label: "Secondary Phone", type: "text" },
      { key: "whatsapp_number", label: "WhatsApp Number", type: "text" },
      { key: "email_primary", label: "Primary Email", type: "text" },
      { key: "email_support", label: "Support Email", type: "text" },
      { key: "office_address", label: "Office Address", type: "textarea" },
      { key: "google_maps_embed", label: "Google Maps Embed URL", type: "text" },
      { key: "business_hours", label: "Business Hours", type: "text" },
    ],
  },
  {
    id: "social",
    label: "Social Media",
    fields: [
      { key: "social_facebook", label: "Facebook URL", type: "text" },
      { key: "social_instagram", label: "Instagram URL", type: "text" },
      { key: "social_linkedin", label: "LinkedIn URL", type: "text" },
      { key: "social_twitter", label: "Twitter/X URL", type: "text" },
      { key: "social_youtube", label: "YouTube URL", type: "text" },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    fields: [
      { key: "footer_copyright", label: "Footer Copyright Text", type: "text" },
      { key: "footer_description", label: "Footer Description", type: "textarea" },
    ],
  },
  {
    id: "seo",
    label: "SEO Defaults",
    fields: [
      { key: "seo_default_title", label: "Default SEO Title", type: "text" },
      { key: "seo_default_description", label: "Default SEO Description", type: "textarea" },
      { key: "seo_keywords", label: "Default SEO Keywords", type: "text" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics & Scripts",
    fields: [
      { key: "google_analytics_id", label: "Google Analytics ID", type: "text" },
      { key: "meta_pixel_id", label: "Meta Pixel ID", type: "text" },
      { key: "header_scripts", label: "Custom Header Scripts", type: "textarea" },
      { key: "footer_scripts", label: "Custom Footer Scripts", type: "textarea" },
    ],
  },
  {
    id: "status",
    label: "Website Status",
    fields: [
      { key: "maintenance_mode", label: "Maintenance Mode", type: "switch" },
      { key: "website_status", label: "Website Status (online/offline)", type: "text" },
    ],
  },
];

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>(settings);

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(formValues)) {
        formData.append(key, value || "");
      }
      const result = await saveWebsiteSettings(formData);
      if (result.success) {
        toast.success("Settings saved successfully");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="general" className="mb-8">
        <TabsList className="flex-wrap h-auto mb-6">
          {SETTINGS_GROUPS.map((group) => (
            <TabsTrigger key={group.id} value={group.id} className="text-xs">
              {group.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SETTINGS_GROUPS.map((group) => (
          <TabsContent key={group.id} value={group.id}>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{group.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {group.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.key}
                        value={formValues[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        rows={3}
                      />
                    ) : field.type === "switch" ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          id={field.key}
                          checked={formValues[field.key] === "true"}
                          onCheckedChange={(checked) =>
                            handleChange(field.key, checked ? "true" : "false")
                          }
                        />
                        <span className="text-sm text-gray-500">
                          {formValues[field.key] === "true" ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type}
                        value={formValues[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="bg-amber-600 hover:bg-amber-700">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Save All Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
