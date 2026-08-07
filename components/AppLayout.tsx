"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { AuthGuard } from "./AuthGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <AuthGuard>
      <div className="flex">
        {/* Hide sidebar navigation completely on login screen */}
        {!isLoginPage && <Sidebar />}
        
        {/* Remove left sidebar padding on login screen */}
        <main
          className={`flex-1 min-h-screen bg-grid-pattern bg-background transition-colors duration-200 ${
            isLoginPage ? "pl-0" : "pl-64"
          }`}
        >
          <div className="max-w-7xl mx-auto p-8 relative">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
