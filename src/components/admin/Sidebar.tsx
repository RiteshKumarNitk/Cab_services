"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  Users,
  Car,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Key,
} from "lucide-react";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
    { name: "Trip Requests", href: "/admin/requests", icon: ClipboardList },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Drivers", href: "/admin/drivers", icon: Key },
    { name: "Vehicles", href: "/admin/vehicles", icon: Car },
    { name: "Pricing", href: "/admin/pricing", icon: CreditCard },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-gray-900 h-screen flex flex-col text-white fixed top-0 left-0 z-20">
      <div className="p-6">
        <Link href="/admin" className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded bg-amber-600 flex items-center justify-center">
            <span className="font-bold">AT</span>
          </div>
          <span className="font-bold text-lg tracking-wide">Aradhana Admin</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-amber-600/10 text-amber-500 font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-amber-500" : "text-gray-500"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
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
