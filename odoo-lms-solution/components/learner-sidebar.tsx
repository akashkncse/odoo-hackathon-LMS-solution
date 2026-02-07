"use client";

import {
  BookOpen,
  GraduationCap,
  LogOut,
  Mail,
  Trophy,
  UserCircle,
} from "lucide-react";
import { useBranding } from "@/hooks/use-branding";
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
import { Badge } from "@/components/ui/badge";

const navItems = [
  {
    title: "Browse Courses",
    url: "/dashboard/courses",
    icon: BookOpen,
  },
  {
    title: "My Learning",
    url: "/dashboard/my-learning",
    icon: GraduationCap,
  },
  {
    title: "Invitations",
    url: "/dashboard/invitations",
    icon: Mail,
  },
  {
    title: "My Points",
    url: "/dashboard/points",
    icon: Trophy,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: UserCircle,
  },
];

export function LearnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { platformName, logoUrl } = useBranding();
  const [pendingInvitationCount, setPendingInvitationCount] = useState(0);

  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const res = await fetch("/api/invitations");
        if (res.ok) {
          const data = await res.json();
          setPendingInvitationCount(data.invitations?.length ?? 0);
        }
      } catch {
        // silently ignore
      }
    }
    fetchPendingCount();

    // Refresh count periodically (every 60 seconds)
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);

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
              <Link href="/dashboard">
                {logoUrl ? (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-muted">
                    <img
                      src={logoUrl}
                      alt={platformName}
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <GraduationCap className="size-4" />
                  </div>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{platformName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Learner
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Learning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span className="flex-1">{item.title}</span>
                      {item.title === "Invitations" &&
                        pendingInvitationCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-auto h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                          >
                            {pendingInvitationCount > 99
                              ? "99+"
                              : pendingInvitationCount}
                          </Badge>
                        )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
