"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Car,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Globe,
  FileText,
  Image,
  MessageSquare,
  HelpCircle,
  Star,
  ChevronDown,
  ChevronRight,
  Menu,
  Newspaper,
} from "lucide-react";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();
  const [cmsOpen, setCmsOpen] = useState(pathname.startsWith("/admin/cms"));

  const mainNavItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Vehicles", href: "/admin/vehicles", icon: Car },
    { name: "Pricing", href: "/admin/pricing", icon: CreditCard },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  ];

  const cmsItems = [
    { name: "Website Settings", href: "/admin/cms/settings", icon: Settings },
    { name: "Homepage", href: "/admin/cms/homepage", icon: LayoutDashboard },
    { name: "Fleet", href: "/admin/cms/fleet", icon: Car },
    { name: "Pricing", href: "/admin/cms/pricing", icon: CreditCard },
    { name: "Navigation", href: "/admin/cms/navigation", icon: Menu },
    { name: "Pages", href: "/admin/cms/pages", icon: FileText },
    { name: "FAQs", href: "/admin/cms/faqs", icon: HelpCircle },
    { name: "Testimonials", href: "/admin/cms/testimonials", icon: Star },
    { name: "Gallery", href: "/admin/cms/gallery", icon: Image },
    { name: "Blogs", href: "/admin/cms/blogs", icon: Newspaper },
    { name: "Contacts", href: "/admin/cms/contacts", icon: MessageSquare },
  ];

  return (
    <div className="w-64 bg-gray-900 h-screen flex flex-col text-white fixed top-0 left-0 z-20">
      <div className="p-6">
        <Link href="/admin" className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded bg-red-600 flex items-center justify-center">
            <span className="font-bold text-sm">AT</span>
          </div>
          <span className="font-bold text-lg tracking-wide">Aradhana Admin</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-red-600/10 text-red-400 font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-red-400" : "text-gray-500"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-4">
          <button
            onClick={() => setCmsOpen(!cmsOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              Content Management
            </span>
            {cmsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          {cmsOpen && (
            <div className="mt-1 space-y-1">
              {cmsItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? "bg-red-600/10 text-red-400 font-medium"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? "text-red-400" : "text-gray-500"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center space-x-3 px-3 py-2.5 w-full text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors rounded-lg"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
