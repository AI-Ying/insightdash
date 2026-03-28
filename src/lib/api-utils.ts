import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Verifies current user is authenticated and a member of the given workspace.
 * Returns user session and workspace data, or a NextResponse error.
 */
export async function verifyWorkspaceMembership(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  if (!membership) {
    return {
      error: NextResponse.json({ error: "Not a workspace member" }, { status: 403 }),
    };
  }

  return { session, membership };
}
