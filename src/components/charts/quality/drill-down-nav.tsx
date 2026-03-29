"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface DrillDownNavProps {
  workshop?: string | null;
  line?: string | null;
  device?: string | null;
  workspaceSlug: string;
}

export function DrillDownNav({ workshop, line, device, workspaceSlug }: DrillDownNavProps) {
  const baseUrl = `/w/${workspaceSlug}/quality`;

  return (
    <div className="flex items-center gap-1 text-sm text-slate-600 mb-4">
      {/* 全厂 */}
      <Link href={baseUrl} className="flex items-center gap-1 hover:text-blue-600">
        <Home className="h-4 w-4" />
        <span>全厂</span>
      </Link>

      {workshop && (
        <>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          {!line ? (
            <span className="font-medium text-slate-900">{workshop}</span>
          ) : (
            <Link href={`${baseUrl}?workshop=${encodeURIComponent(workshop)}`} className="hover:text-blue-600">
              {workshop}
            </Link>
          )}
        </>
      )}

      {line && (
        <>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          {!device ? (
            <span className="font-medium text-slate-900">{line}</span>
          ) : (
            <Link
              href={`${baseUrl}?workshop=${encodeURIComponent(workshop || "")}&line=${encodeURIComponent(line)}`}
              className="hover:text-blue-600"
            >
              {line}
            </Link>
          )}
        </>
      )}

      {device && (
        <>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-900">{device}</span>
        </>
      )}
    </div>
  );
}
