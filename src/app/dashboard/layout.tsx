"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "No-Show Risk",
    href: "/dashboard/no-show",
    icon: ClipboardList,
  },
  {
    label: "Patient Flow",
    href: "/dashboard/flow",
    icon: Activity,
  },
  {
    label: "Schedule",
    href: "/dashboard/schedule",
    icon: CalendarClock,
  },
  {
    label: "Waitlist",
    href: "/dashboard/waitlist",
    icon: Users,
  },
  { separator: true } as const,
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Reminders",
    href: "/dashboard/reminders",
    icon: Bell,
  },
  {
    label: "Doctors",
    href: "/dashboard/doctors",
    icon: Stethoscope,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
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
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm tracking-tight">
            Patient Flow AI
          </span>
        </div>
        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-0.5 px-2">
            {navItems.map((item, i) => {
              if ("separator" in item) {
                return <Separator key={i} className="my-2" />;
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
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="border-t border-border p-3">
          <p className="text-[10px] text-muted-foreground font-mono">
            Patient Flow AI v0.1.0
          </p>
          <p className="text-[10px] text-muted-foreground">
            VisioCorp Health Division
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
