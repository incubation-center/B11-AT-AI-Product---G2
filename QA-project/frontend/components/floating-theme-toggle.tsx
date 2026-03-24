"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Shows a theme control on auth/marketing routes. Dashboard uses Topbar instead.
 */
export function FloatingThemeToggle() {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }
  return (
    <div className="fixed top-4 right-4 z-50 md:right-6">
      <ThemeToggle />
    </div>
  );
}
