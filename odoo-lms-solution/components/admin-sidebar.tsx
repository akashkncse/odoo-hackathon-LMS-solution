"use client";

import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: BarChart3,
  },
  {
    title: "My Courses",
    url: "/admin/courses",
    icon: BookOpen,
  },
];

const superadminItems = [
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Landing Page",
    url: "/admin/landing-page",
    icon: LayoutDashboard,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function fetchRole() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setRole(data.user?.role ?? null);
        }
      } catch {
        // ignore
      }
    }
    fetchRole();
  }, []);

  const isSuperadmin = role === "superadmin";

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to log out. Please try again.");
      setLoggingOut(false);
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <BookOpen className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LMS Admin</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Dashboard
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.url)
                    }
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperadmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Site</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superadminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.url)}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={loggingOut}
              tooltip="Log out"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              <span>{loggingOut ? "Logging out..." : "Log out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
