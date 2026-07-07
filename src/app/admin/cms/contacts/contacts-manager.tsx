"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { markContactRead, deleteContactSubmission } from "@/lib/admin-cms";
import { Trash2, Mail, MailOpen } from "lucide-react";

type ContactData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  department: string | null;
  isRead: boolean;
  createdAt: string;
};

export function ContactsManager({ submissions: initial }: { submissions: ContactData[] }) {
  const [submissions, setSubmissions] = useState(initial);

  const handleMarkRead = async (id: string) => {
    try {
      await markContactRead(id);
      setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, isRead: true } : s)));
      toast.success("Marked as read");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    try {
      await deleteContactSubmission(id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const unread = submissions.filter((s) => !s.isRead).length;

  return (
    <div className="space-y-4">
      {unread > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          {unread} unread message{unread !== 1 ? "s" : ""}
        </div>
      )}

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">From</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!s.isRead ? "bg-blue-50/50" : ""}`}>
                  <td className="py-3 px-4">
                    <div className={`font-medium ${!s.isRead ? "text-gray-900" : "text-gray-600"}`}>{s.name}</div>
                    <div className="text-xs text-gray-500">{s.email}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{s.subject || "No subject"}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {s.isRead ? (
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <MailOpen className="h-3.5 w-3.5" /> Read
                      </span>
                    ) : (
                      <span className="text-blue-600 text-xs font-medium flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> New
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!s.isRead && (
                        <Button size="sm" variant="ghost" onClick={() => handleMarkRead(s.id)}>
                          <MailOpen className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <p>No contact submissions yet.</p>
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
