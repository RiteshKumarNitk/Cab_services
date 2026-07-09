"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, User, LogOut } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CustomerTopHeader() {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <button className="relative text-gray-500 hover:text-gray-900 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
            3
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-red-600 text-white font-bold text-xs">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start text-sm">
              <span className="font-semibold text-gray-900 leading-tight">
                {session?.user?.name || "User"}
              </span>
              <span className="text-xs text-gray-500">Customer</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Link href="/customer/profile" className="flex items-center w-full">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="p-0">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center px-2 py-1.5 text-red-600 hover:bg-red-50 cursor-pointer rounded-sm"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
