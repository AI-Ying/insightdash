import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function generateUniqueSlug(name: string): string {
  const base = generateSlug(name);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
