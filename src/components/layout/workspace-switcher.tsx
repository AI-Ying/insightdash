"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Plus, Check } from "lucide-react";

interface WorkspaceSwitcherProps {
  currentSlug: string;
  workspaces: Array<{ id: string; name: string; slug: string }>;
  collapsed: boolean;
}

export function WorkspaceSwitcher({ currentSlug, workspaces, collapsed }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const current = workspaces.find((w) => w.slug === currentSlug);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/w/${data.slug}`);
        router.refresh();
        setOpen(false);
        setCreating(false);
        setNewName("");
      }
    } catch (error) {
      console.error("Failed to create workspace:", error);
    }
  }

  if (collapsed) {
    return (
      <div className="flex justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
          {current?.name?.[0]?.toUpperCase() || "W"}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-700">
          {current?.name?.[0]?.toUpperCase() || "W"}
        </div>
        <span className="flex-1 truncate text-left font-medium text-slate-700">
          {current?.name || "Select workspace"}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                router.push(`/w/${ws.slug}`);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50",
                ws.slug === currentSlug && "bg-blue-50"
              )}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-700">
                {ws.name[0].toUpperCase()}
              </div>
              <span className="flex-1 truncate text-left">{ws.name}</span>
              {ws.slug === currentSlug && <Check className="h-4 w-4 text-blue-600" />}
            </button>
          ))}
          <div className="border-t border-slate-100 mt-1 pt-1">
            {creating ? (
              <div className="px-3 py-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Workspace name"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                New Workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
