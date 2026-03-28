import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  // Get current workspace slug from URL or default to first
  const resolvedParams = await params;
  const currentSlug = resolvedParams?.slug || workspaces[0]?.slug || "";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspaceSlug={currentSlug} workspaces={workspaces} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
