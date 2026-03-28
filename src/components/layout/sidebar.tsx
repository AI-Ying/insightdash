"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "./workspace-switcher";
import {
  LayoutDashboard,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  workspaceSlug: string;
  workspaces: Array<{ id: string; name: string; slug: string }>;
}

const navItems = [
  { label: "Dashboards", icon: LayoutDashboard, href: "" },
  { label: "Data Sources", icon: Database, href: "/datasources" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar({ workspaceSlug, workspaces }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center border-b border-slate-200 px-4">
        {!collapsed && (
          <span className="text-lg font-bold text-slate-900">
            Insight<span className="text-blue-600">Dash</span>
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600",
            collapsed ? "mx-auto" : "ml-auto"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="p-3">
        <WorkspaceSwitcher
          currentSlug={workspaceSlug}
          workspaces={workspaces}
          collapsed={collapsed}
        />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const href = `/w/${workspaceSlug}${item.href}`;
          const isActive = pathname === href || (item.href === "" && pathname === `/w/${workspaceSlug}`);
          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
