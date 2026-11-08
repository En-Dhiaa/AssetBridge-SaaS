"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, ShieldCheck, Zap, Coins, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Downloader", href: "/", icon: Download },
    { name: "Pricing", href: "/#pricing", icon: Coins },
    { name: "Compliance & Audit", href: "/compliance", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition">
              <div className="h-full w-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  MagnificDownloader
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Clean Watermark-Free Asset Engine
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    isActive
                      ? "bg-slate-800 text-blue-400 shadow-inner"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* User Credits Pill */}
          <Link
            href="/#pricing"
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition text-xs group"
          >
            <Coins className="h-3.5 w-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span className="text-slate-300 font-mono font-bold">15 Credits</span>
            <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-full">
              + Top Up
            </span>
          </Link>

          {/* Quick SLA Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>16x Stream Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
