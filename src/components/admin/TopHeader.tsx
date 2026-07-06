"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, Search, Moon, User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopHeader() {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 w-96">
        <Search className="h-4 w-4 text-gray-500 mr-2" />
        <input 
          type="text" 
          placeholder="Search bookings, customers, or vehicles..." 
          className="bg-transparent border-none focus:outline-none text-sm w-full"
        />
      </div>

      <div className="flex items-center space-x-6">
        <button className="text-gray-500 hover:text-gray-900 transition-colors">
          <Moon className="h-5 w-5" />
        </button>
        <button className="relative text-gray-500 hover:text-gray-900 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
            3
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-amber-600 text-white font-bold text-xs">
                {session?.user?.name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start text-sm">
              <span className="font-semibold text-gray-900 leading-tight">{session?.user?.name || "Admin"}</span>
              <span className="text-xs text-gray-500">Administrator</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="p-0">
              <button
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
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
