import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LearnerSidebar } from "@/components/learner-sidebar";
import { Separator } from "@/components/ui/separator";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "learner") {
    redirect("/admin");
  }

  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarCookie !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <LearnerSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium">Dashboard</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
