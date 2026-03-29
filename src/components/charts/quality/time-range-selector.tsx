"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

export type TimeRange = "today" | "week" | "month" | "lastMonth" | "custom";

interface TimeRangeSelectorProps {
  value: TimeRange;
  customRange?: { start: string; end: string };
  onChange: (range: TimeRange, customRange?: { start: string; end: string }) => void;
}

export function TimeRangeSelector({ value, customRange, onChange }: TimeRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(value === "custom");

  const options: { value: TimeRange; label: string }[] = [
    { value: "today", label: "今日" },
    { value: "week", label: "本周" },
    { value: "month", label: "本月" },
    { value: "lastMonth", label: "上月" },
    { value: "custom", label: "自定义" },
  ];

  const handleChange = (newValue: TimeRange) => {
    if (newValue === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(newValue);
    }
  };

  const handleCustomApply = () => {
    onChange("custom", customRange);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Quick options */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleChange(opt.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              value === opt.value
                ? "bg-blue-100 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom date picker */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={customRange?.start || ""}
            onChange={(e) => onChange("custom", { start: e.target.value, end: customRange?.end || e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <span className="text-slate-400">至</span>
          <input
            type="date"
            value={customRange?.end || ""}
            onChange={(e) => onChange("custom", { start: customRange?.start || e.target.value, end: e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            onClick={handleCustomApply}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            应用
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Get date range from TimeRange
 */
export function getDateRange(range: TimeRange, customRange?: { start: string; end: string }): { start: string; end: string } {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  switch (range) {
    case "today":
      return { start: todayStr, end: todayStr };

    case "week": {
      // Get Monday of current week
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(diff);
      return { start: monday.toISOString().slice(0, 10), end: todayStr };
    }

    case "month": {
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      return { start: `${year}-${month}-01`, end: todayStr };
    }

    case "lastMonth": {
      const year = today.getFullYear();
      const month = today.getMonth(); // 0-indexed
      const lastMonth = month === 0 ? 12 : month;
      const lastMonthYear = month === 0 ? year - 1 : year;
      const daysInLastMonth = new Date(lastMonthYear, lastMonth, 0).getDate();
      return {
        start: `${lastMonthYear}-${lastMonth.toString().padStart(2, "0")}-01`,
        end: `${lastMonthYear}-${lastMonth.toString().padStart(2, "0")}-${daysInLastMonth}`,
      };
    }

    case "custom":
      return customRange || { start: todayStr, end: todayStr };

    default:
      return { start: todayStr, end: todayStr };
  }
}
