"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Car,
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  LayoutDashboard,
  LogOut,
  User,
  Menu,
  X,
  Phone,
  Mail,
  ChevronDown,
  Clock,
} from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  url: string;
  target: string;
  children?: NavItem[];
};

export function Navbar({ navigation, settings }: { navigation?: NavItem[]; settings?: Record<string, string> }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const role = session?.user?.role;
  const companyName = settings?.company_name || "Aradhana Travel";
  const companyLogo = settings?.company_logo || "";
  const phonePrimary = settings?.phone_primary || "+91 73530 19999";
  const emailPrimary = settings?.email_primary || "riyaz.abbas@yahoo.com";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const getMenuItems = () => {
    const dynamicItems = (navigation || []).map((item) => ({
      href: item.url,
      label: item.label,
      children: item.children?.map((c) => ({
        href: c.url,
        label: c.label,
      })),
    }));

    const defaultItems = [
      { href: "/", label: "Home", children: undefined },
      {
        href: "#",
        label: "Bookings",
        children: [
          { href: "/booking/print", label: "Print Ticket" },
          { href: "/booking/edit", label: "Edit Ticket" },
          { href: "/booking/cancel", label: "Cancel Ticket" },
          { href: "/customer/bookings", label: "My Bookings" },
        ],
      },
      { href: "/destinations", label: "Destinations", children: undefined },
      { href: "/fleet", label: "Fleet", children: undefined },
      { href: "/tours", label: "Tours", children: undefined },
      { href: "/services", label: "Services", children: undefined },
      { href: "/contact", label: "Contact", children: undefined },
    ];

    return dynamicItems.length > 0 ? dynamicItems : defaultItems;
  };

  const menuItems = getMenuItems();

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-red-700 text-white text-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between">
          <a href={`tel:${phonePrimary.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-red-200 transition-colors">
            <Phone className="h-3.5 w-3.5" /> {phonePrimary}
          </a>
          <a href={`mailto:${emailPrimary}`} className="flex items-center gap-1.5 hover:text-red-200 transition-colors">
            <Mail className="h-3.5 w-3.5" /> {emailPrimary}
          </a>
        </div>
      </div>

      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="h-10 w-auto" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-red-600 flex items-center justify-center">
                  <Car className="h-5 w-5 text-white" />
                </div>
              )}
              <span className="font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors hidden sm:block">
                {companyName}
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => {
                const active = isActive(item.href);
                const hasChildren = item.children && item.children.length > 0 && item.href === "#";

                if (hasChildren) {
                  return (
                    <div
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          active
                            ? "text-red-700 bg-red-50"
                            : "text-gray-700 hover:text-red-600 hover:bg-red-50"
                        }`}
                      >
                        {item.label}
                        <ChevronDown className="h-3.5 w-3.5 ml-1" />
                      </button>
                      {openDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-gray-100 py-1.5 z-50"
                        >
{item.children?.map((child: { href: string; label: string }) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? "text-red-700 bg-red-50"
                          : "text-gray-700 hover:text-red-600 hover:bg-red-50"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="cursor-pointer inline-flex items-center justify-center rounded-full h-9 w-9 focus:outline-none hover:opacity-80 transition-opacity">
                    <Avatar className="h-9 w-9 ring-2 ring-red-100">
                      <AvatarFallback className="bg-red-100 text-red-700 text-sm font-semibold">
                        {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 mt-2 border-0 shadow-xl shadow-gray-200/50" align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="font-semibold">{session.user?.name}</span>
                          <span className="text-xs text-gray-500 font-normal">{session.user?.email}</span>
                          <span className="mt-1.5">
                            <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-medium">{role}</span>
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      </DropdownMenuGroup>

                      {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-xs text-gray-400 font-normal uppercase tracking-wider px-2 pt-1 pb-0">Admin Panel</DropdownMenuLabel>
                            {[
                              { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
                              { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
                              { href: "/admin/users", label: "Users", icon: Users },
                              { href: "/admin/vehicles", label: "Vehicles", icon: Car },
                              { href: "/admin/pricing", label: "Pricing", icon: CreditCard },
                              { href: "/admin/reports", label: "Reports", icon: BarChart3 },
                            ].map((item) => (
                              <Link key={item.href} href={item.href}>
                                <DropdownMenuItem className="cursor-pointer hover:bg-red-50">
                                  <item.icon className="h-4 w-4 mr-3 text-red-600" /> {item.label}
                                </DropdownMenuItem>
                              </Link>
                            ))}
                          </DropdownMenuGroup>
                        </>
                      )}

                      {role === "CUSTOMER" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-xs text-gray-400 font-normal uppercase tracking-wider px-2 pt-1 pb-0">My Account</DropdownMenuLabel>
                            {[
                              { href: "/customer", label: "Dashboard", icon: LayoutDashboard },
                              { href: "/customer/bookings", label: "My Bookings", icon: CalendarCheck },
                              { href: "/customer/history", label: "Ride History", icon: Clock },
                              { href: "/customer/profile", label: "Profile", icon: User },
                            ].map((item) => (
                              <Link key={item.href} href={item.href}>
                                <DropdownMenuItem className="cursor-pointer hover:bg-red-50">
                                  <item.icon className="h-4 w-4 mr-3 text-red-600" /> {item.label}
                                </DropdownMenuItem>
                              </Link>
                            ))}
                          </DropdownMenuGroup>
                        </>
                      )}

                      {role === "DRIVER" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-xs text-gray-400 font-normal uppercase tracking-wider px-2 pt-1 pb-0">Driver Panel</DropdownMenuLabel>
                            {[
                              { href: "/driver", label: "Dashboard", icon: LayoutDashboard },
                              { href: "/driver/rides", label: "My Rides", icon: CalendarCheck },
                              { href: "/driver/earnings", label: "Earnings", icon: CreditCard },
                            ].map((item) => (
                              <Link key={item.href} href={item.href}>
                                <DropdownMenuItem className="cursor-pointer hover:bg-red-50">
                                  <item.icon className="h-4 w-4 mr-3 text-red-600" /> {item.label}
                                </DropdownMenuItem>
                              </Link>
                            ))}
                          </DropdownMenuGroup>
                        </>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="p-0">
                        <button
                          onClick={() => signOut({ callbackUrl: "/login" })}
                          className="flex w-full items-center px-2 py-1.5 text-red-600 cursor-pointer hover:bg-red-50 rounded-md"
                        >
                          <LogOut className="h-4 w-4 mr-2" /> Sign Out
                        </button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" className="hover:bg-red-50 hover:text-red-600 text-sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-red-600 hover:bg-red-700 text-white text-sm shadow-sm">
                      Register
                    </Button>
                  </Link>
                </div>
              )}

              <button
                className="lg:hidden ml-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t border-gray-100 bg-white shadow-lg overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {menuItems.map((item) => {
                  const active = isActive(item.href);
                  const hasChildren = item.children && item.children.length > 0;

                  if (hasChildren && item.href === "#") {
                    return (
                      <div key={item.label}>
                        <div className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700">
                          {item.label}
                        </div>
{item.children?.map((child: { href: string; label: string }) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-8 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
              >
                {child.label}
              </Link>
            ))}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? "bg-red-50 text-red-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                {session && (
                  <div className="border-t pt-2 mt-2">
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
