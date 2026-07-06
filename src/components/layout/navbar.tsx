"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const role = session?.user?.role;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getMenuItems = () => {
    if (role === "ADMIN") {
      return [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/vehicles", label: "Vehicles", icon: Car },
        { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
        { href: "/admin/pricing", label: "Pricing", icon: CreditCard },
        { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      ];
    }
    if (role === "DRIVER") {
      return [
        { href: "/driver", label: "Dashboard", icon: LayoutDashboard },
        { href: "/driver/rides", label: "My Rides", icon: CalendarCheck },
        { href: "/driver/earnings", label: "Earnings", icon: CreditCard },
      ];
    }
    if (role === "CUSTOMER") {
      return [
        { href: "/customer", label: "Dashboard", icon: LayoutDashboard },
        { href: "/customer/bookings", label: "Book Ride", icon: Car },
        { href: "/customer/history", label: "History", icon: CalendarCheck },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm"
          : "bg-white border-b border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20"
              >
                <span className="text-sm font-bold text-white">AT</span>
              </motion.div>
              <span className="font-semibold text-gray-900 hidden sm:block group-hover:text-blue-600 transition-colors">
                Aradhana Travel
              </span>
            </Link>
            {session && (
              <div className="hidden md:flex ml-10 space-x-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        whileHover={{ y: -1 }}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-blue-50 text-blue-700 shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                        {isActive && (
                          <motion.div
                            layoutId="nav-active"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="cursor-pointer">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9 ring-2 ring-blue-100">
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 text-sm font-semibold">
                          {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2 border-0 shadow-xl shadow-gray-200/50" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{session.user?.name}</span>
                      <span className="text-xs text-gray-500 font-normal">
                        {session.user?.email}
                      </span>
                      <span className="mt-1.5">
                        <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {role}
                        </span>
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {role === "CUSTOMER" && (
                    <Link href="/customer/profile">
                      <DropdownMenuItem className="cursor-pointer hover:bg-blue-50">
                        <User className="h-4 w-4 mr-2 text-blue-600" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-red-600 cursor-pointer hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="ghost" className="hover:bg-blue-50 hover:text-blue-600">
                      Sign In
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/auth/register">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20">
                      Register
                    </Button>
                  </motion.div>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {session && (
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <AnimatePresence mode="wait">
                    {mobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                      >
                        <X className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                      >
                        <Menu className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Animated Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && session && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-gray-100 bg-white shadow-lg overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: menuItems.length * 0.05 }}
                className="border-t pt-2 mt-2"
              >
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
