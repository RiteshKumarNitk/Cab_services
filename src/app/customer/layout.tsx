"use client";

import { usePathname } from "next/navigation";
import { CustomerSidebar } from "@/components/customer/CustomerSidebar";
import { CustomerTopHeader } from "@/components/customer/CustomerTopHeader";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/customer/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <CustomerSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <CustomerTopHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
