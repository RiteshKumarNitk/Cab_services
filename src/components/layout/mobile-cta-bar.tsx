"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, MessageSquareText, FileText } from "lucide-react";

export function MobileCtaBar({ phone, whatsapp }: { phone?: string; whatsapp?: string }) {
  const [visible, setVisible] = useState(true);
  const phoneNumber = phone || "+917353019999";
  const whatsappNumber = whatsapp || phoneNumber;

  useEffect(() => {
    const handler = () => {
      if (window.visualViewport) {
        setVisible(window.visualViewport.height > 300);
      }
    };
    window.visualViewport?.addEventListener("resize", handler);
    return () => window.visualViewport?.removeEventListener("resize", handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] lg:hidden safe-area-inset-bottom">
      <div className="flex items-center h-16 px-2 gap-1">
        <a
          href={`tel:${phoneNumber.replace(/\s/g, "")}`}
          className="flex-1 flex flex-col items-center justify-center h-full rounded-lg hover:bg-gray-50 transition-colors gap-0.5"
        >
          <Phone className="h-5 w-5 text-red-700" />
          <span className="text-[10px] font-medium text-gray-700">Call</span>
        </a>
        <a
          href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center justify-center h-full rounded-lg hover:bg-gray-50 transition-colors gap-0.5"
        >
          <MessageSquareText className="h-5 w-5 text-emerald-600" />
          <span className="text-[10px] font-medium text-gray-700">WhatsApp</span>
        </a>
        <Link
          href="/#booking-form"
          className="flex-[1.5] flex items-center justify-center h-12 rounded-lg bg-red-700 hover:bg-red-800 text-white transition-colors gap-1.5 shadow-sm"
        >
          <FileText className="h-4 w-4" />
          <span className="text-sm font-semibold">Get Quote</span>
        </Link>
      </div>
    </div>
  );
}
