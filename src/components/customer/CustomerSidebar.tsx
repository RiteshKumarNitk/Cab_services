"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  User,
  Car,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

export function CustomerSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/customer", icon: LayoutDashboard },
    { name: "My Bookings", href: "/customer/bookings", icon: CalendarCheck },
    { name: "Ride History", href: "/customer/history", icon: Clock },
    { name: "Profile", href: "/customer/profile", icon: User },
  ];

  return (
    <div className="w-64 bg-gray-900 h-screen flex flex-col text-white fixed top-0 left-0 z-20">
      <div className="p-6">
        <Link href="/customer" className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded bg-red-600 flex items-center justify-center">
            <span className="font-bold text-sm">AT</span>
          </div>
          <span className="font-bold text-lg tracking-wide">My Account</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/customer"
              ? pathname === "/customer"
              : pathname.startsWith(item.href);
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
              <item.icon
                className={`h-5 w-5 ${
                  isActive ? "text-red-400" : "text-gray-500"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-4">
          <Link
            href="/"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Car className="h-5 w-5 text-gray-500" />
            <span>Book a Ride</span>
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center space-x-3 px-3 py-2.5 w-full text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors rounded-lg"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
