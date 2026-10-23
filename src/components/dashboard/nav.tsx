"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Shield, 
  LayoutDashboard, 
  KeyRound, 
  History, 
  Users, 
  Terminal, 
  LogOut,
  Zap
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavProps {
  userEmail?: string;
  userName?: string;
}

export function DashboardNav({ userEmail, userName }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/licenses", label: "Registrations", icon: KeyRound },
    { href: "/dashboard/audit", label: "Credit Audit Log", icon: History },
    { href: "/dashboard/admins", label: "Admin Team", icon: Users },
    { href: "/dashboard/docs", label: "EXE Client & API", icon: Terminal },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 border-r border-zinc-800 bg-[#0d0f18] flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-white tracking-wider text-sm flex items-center gap-1.5">
              KURO <span className="text-indigo-400 font-medium">MANAGER</span>
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
              Admin Portal
            </div>
          </div>
        </Link>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-zinc-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Live Status indicator */}
      <div className="p-3 mx-3 mb-3 rounded-lg bg-indigo-950/30 border border-indigo-900/50 text-xs">
        <div className="flex items-center gap-2 text-indigo-300 font-medium mb-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          EXE Server Active
        </div>
        <p className="text-[11px] text-zinc-400 font-mono">POST /api/authorize</p>
      </div>

      {/* User info & Logout */}
      <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
        <div className="overflow-hidden pr-2">
          <p className="text-xs font-semibold text-white truncate">{userName || "Administrator"}</p>
          <p className="text-[11px] text-zinc-400 truncate">{userEmail || "admin@system"}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          isLoading={isLoggingOut}
          title="Sign out"
          className="text-zinc-400 hover:text-red-400 hover:bg-red-950/30 shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}
