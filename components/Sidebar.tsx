"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Globe,
  Image as ImageIcon,
  History,
  Heart,
  Download,
  Settings,
  Sun,
  Moon,
  Compass,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";
import { Sparkles, User as UserIcon } from "lucide-react";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { name: "Inspector", href: "/inspector", icon: Globe },
  { name: "Images", href: "/images", icon: ImageIcon },
  { name: "History", href: "/history", icon: History },
  { name: "Favorites", href: "/favorites", icon: Heart },
  { name: "Exports", href: "/exports", icon: Download },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-border gap-2">
          <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-lg shadow-sm">
            C
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-foreground text-base">ColorMind</h1>
            <p className="text-[10px] text-muted-foreground font-medium -mt-1">
              Design System Inspector
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar-nav"
                    className="absolute inset-0 bg-secondary rounded-lg z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer & Theme Toggle */}
      <div className="p-4 border-t border-border flex flex-col gap-4 bg-card">
        {/* Authentication CTA Profile */}
        {user ? (
          <div className="px-3 py-2.5 rounded-lg bg-secondary/50 border border-border/40 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2 min-w-0 w-full">
              <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-foreground font-semibold truncate flex-1 text-left" title={user.email}>
                {user.email}
              </p>
            </div>
            <button
              onClick={signOut}
              className="w-full text-center text-[9px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider mt-1"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3 py-2.5 rounded-lg bg-foreground hover:opacity-90 text-background border border-border text-center font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Sign In / Register
          </Link>
        )}

        {/* Theme Toggle Buttons */}
        <div className="grid grid-cols-2 gap-1 bg-secondary/80 p-1 rounded-lg border border-border">
          <button
            onClick={() => setTheme("light")}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              theme === "light"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              theme === "dark"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Dark
          </button>
        </div>
      </div>
    </aside>
  );
}
