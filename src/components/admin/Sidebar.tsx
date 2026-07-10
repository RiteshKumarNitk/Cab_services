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
  UserPlus,
  FileSpreadsheet,
  Route,
  Calendar,
  Wrench,
  PiggyBank,
  PhoneCall,
  ClipboardList,
  Building2,
  Truck,
  Gauge,
  Smartphone,
  Fuel,
} from "lucide-react";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();
  const [cmsOpen, setCmsOpen] = useState(pathname.startsWith("/admin/cms"));
  const [crmOpen, setCrmOpen] = useState(pathname.startsWith("/admin/leads") || pathname.startsWith("/admin/followups") || pathname.startsWith("/admin/customers"));
  const [opsOpen, setOpsOpen] = useState(
    pathname.startsWith("/admin/calendar") ||
    pathname.startsWith("/admin/dispatch") ||
    pathname.startsWith("/admin/bookings") ||
    pathname.startsWith("/admin/trips")
  );
  const [fleetOpen, setFleetOpen] = useState(
    pathname.startsWith("/admin/vehicles") ||
    pathname.startsWith("/admin/maintenance")
  );
  const [salesOpen, setSalesOpen] = useState(
    pathname.startsWith("/admin/quotations") ||
    pathname.startsWith("/admin/pricing")
  );

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
        {/* Dashboard */}
        <NavLink href="/admin" icon={LayoutDashboard} label="Dashboard" pathname={pathname} />

        {/* Operations Section — FIRST (ops teams live here) */}
        <SectionToggle
          label="Operations"
          icon={ClipboardList}
          isOpen={opsOpen}
          onToggle={() => setOpsOpen(!opsOpen)}
        />
        {opsOpen && (
          <div className="ml-2 space-y-1">
            <NavLink href="/admin/calendar" icon={Calendar} label="Calendar" pathname={pathname} />
            <NavLink href="/admin/dispatch" icon={Gauge} label="Dispatch Board" pathname={pathname} />
            <NavLink href="/admin/bookings" icon={CalendarCheck} label="Bookings" pathname={pathname} />
            <NavLink href="/admin/trips" icon={Truck} label="Trips" pathname={pathname} />
          </div>
        )}

        {/* CRM Section */}
        <SectionToggle
          label="CRM"
          icon={Users}
          isOpen={crmOpen}
          onToggle={() => setCrmOpen(!crmOpen)}
        />
        {crmOpen && (
          <div className="ml-2 space-y-1">
            <NavLink href="/admin/leads" icon={UserPlus} label="Leads" pathname={pathname} />
            <NavLink href="/admin/followups" icon={PhoneCall} label="Follow-ups" pathname={pathname} />
            <NavLink href="/admin/customers" icon={Building2} label="Customers" pathname={pathname} />
          </div>
        )}

        {/* Sales Section */}
        <SectionToggle
          label="Sales"
          icon={FileSpreadsheet}
          isOpen={salesOpen}
          onToggle={() => setSalesOpen(!salesOpen)}
        />
        {salesOpen && (
          <div className="ml-2 space-y-1">
            <NavLink href="/admin/quotations" icon={FileText} label="Quotations" pathname={pathname} />
            <NavLink href="/admin/pricing" icon={CreditCard} label="Pricing" pathname={pathname} />
          </div>
        )}

        {/* Fleet Section */}
        <SectionToggle
          label="Fleet"
          icon={Car}
          isOpen={fleetOpen}
          onToggle={() => setFleetOpen(!fleetOpen)}
        />
        {fleetOpen && (
          <div className="ml-2 space-y-1">
            <NavLink href="/admin/vehicles" icon={Car} label="Vehicles" pathname={pathname} />
            <NavLink href="/admin/maintenance" icon={Wrench} label="Maintenance" pathname={pathname} />
            <NavLink href="/admin/fleet/fuel" icon={Fuel} label="Fuel" pathname={pathname} />
          </div>
        )}

        {/* Drivers */}
        <NavLink href="/admin/drivers" icon={Users} label="Drivers" pathname={pathname} />

        {/* Finance */}
        <NavLink href="/admin/finance" icon={PiggyBank} label="Finance" pathname={pathname} />

        {/* Reports */}
        <NavLink href="/admin/reports" icon={BarChart3} label="Reports" pathname={pathname} />

        {/* CMS Section */}
        <div className="pt-2 mt-2 border-t border-gray-800">
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
              <CmsNavLink href="/admin/cms/settings" icon={Settings} label="Website Settings" pathname={pathname} />
              <CmsNavLink href="/admin/cms/homepage" icon={LayoutDashboard} label="Homepage" pathname={pathname} />
              <CmsNavLink href="/admin/cms/fleet" icon={Car} label="Fleet" pathname={pathname} />
              <CmsNavLink href="/admin/cms/pricing" icon={CreditCard} label="Pricing" pathname={pathname} />
              <CmsNavLink href="/admin/cms/navigation" icon={Menu} label="Navigation" pathname={pathname} />
              <CmsNavLink href="/admin/cms/pages" icon={FileText} label="Pages" pathname={pathname} />
              <CmsNavLink href="/admin/cms/faqs" icon={HelpCircle} label="FAQs" pathname={pathname} />
              <CmsNavLink href="/admin/cms/testimonials" icon={Star} label="Testimonials" pathname={pathname} />
              <CmsNavLink href="/admin/cms/gallery" icon={Image} label="Gallery" pathname={pathname} />
              <CmsNavLink href="/admin/cms/blogs" icon={Newspaper} label="Blogs" pathname={pathname} />
              <CmsNavLink href="/admin/cms/contacts" icon={MessageSquare} label="Contacts" pathname={pathname} />
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="pt-2 pb-4">
          <NavLink href="/admin/settings" icon={Settings} label="Settings" pathname={pathname} />
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

function NavLink({ href, icon: Icon, label, pathname }: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pathname: string;
}) {
  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
        isActive
          ? "bg-red-600/10 text-red-400 font-medium"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
      }`}
    >
      <Icon className={`h-5 w-5 ${isActive ? "text-red-400" : "text-gray-500"}`} />
      <span>{label}</span>
    </Link>
  );
}

function CmsNavLink({ href, icon: Icon, label, pathname }: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pathname: string;
}) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
        isActive
          ? "bg-red-600/10 text-red-400 font-medium"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
      }`}
    >
      <Icon className={`h-4 w-4 ${isActive ? "text-red-400" : "text-gray-500"}`} />
      <span>{label}</span>
    </Link>
  );
}

function SectionToggle({ label, icon: Icon, isOpen, onToggle }: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
    </button>
  );
}
