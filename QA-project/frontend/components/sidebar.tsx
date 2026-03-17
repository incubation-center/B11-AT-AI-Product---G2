"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Upload,
  Bug,
  BarChart3,
  BotMessageSquare,
  FileText,
  Users,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/datasets", label: "Testcase Documents", icon: Upload },
  { href: "/dashboard/defects", label: "Defects", icon: Bug },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/ai-chat", label: "AI Chat", icon: BotMessageSquare },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
];

const adminItems = [
  { href: "/dashboard/users", label: "Users", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <Bug className="h-6 w-6 text-foreground" />
          <span className="text-lg font-semibold text-foreground">QA Analytics</span>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ))}

            {user?.role === "admin" && (
              <>
                <Separator className="my-2" />
                <span className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Admin
                </span>
                {adminItems.map((item) => (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link href={item.href}>
                        <Button
                          variant={isActive(item.href) ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3",
                            isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="hidden">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </>
            )}
          </nav>
        </ScrollArea>

        <div className="border-t border-border p-3">
          <div className="mb-2 px-3 py-2">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
