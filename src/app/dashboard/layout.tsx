"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  Calendar,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PlugZap,
  Settings,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlowBotWidget } from "@/components/flowbot-chat";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "No-Show Risk", href: "/dashboard/no-show", icon: ClipboardList },
  { label: "Patient Flow", href: "/dashboard/flow", icon: Activity },
  { label: "Schedule", href: "/dashboard/schedule", icon: CalendarClock },
  { label: "Waitlist", href: "/dashboard/waitlist", icon: Users },
  { label: "Engagement", href: "/dashboard/engagement", icon: MessageSquare },
  { label: "FlowBot", href: "/dashboard/chat", icon: Bot },
  { separator: true } as const,
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Reminders", href: "/dashboard/reminders", icon: Bell },
  { label: "Doctors", href: "/dashboard/doctors", icon: Stethoscope },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { separator: true } as const,
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
  { label: "Check-In", href: "/dashboard/checkin", icon: UserCheck },
  { label: "Daily Tasks", href: "/dashboard/daily", icon: ClipboardList },
  { label: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Connections", href: "/dashboard/connections", icon: PlugZap },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border/50 bg-[oklch(0.07_0_0)]">
        <div className="flex h-12 items-center px-4 border-b border-border/50">
          <span className="text-xs font-mono text-muted-foreground tracking-wide">
            patient-flow-ai
          </span>
        </div>
        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-px px-2">
            {navItems.map((item, i) => {
              if ("separator" in item) {
                return (
                  <div key={i} className="h-px bg-border/50 my-2 mx-2" />
                );
              }
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                    isActive
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="border-t border-border/50 px-3 py-3 space-y-2">
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <LogOut className="h-3 w-3" />
            Sign out
          </button>
          <p className="text-[10px] text-muted-foreground/40 font-mono">
            v0.2.0
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>

      {/* FlowBot — always accessible */}
      <FlowBotWidget />
    </div>
  );
}
