import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceRedirectPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const firstWorkspace = await prisma.workspace.findFirst({
    where: {
      members: { some: { userId: session.user.id } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (firstWorkspace) {
    redirect(`/w/${firstWorkspace.slug}`);
  }

  redirect("/login");
}
