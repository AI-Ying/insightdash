import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceMembership } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; dashboardId: string }> }
) {
  const { workspaceId, dashboardId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, workspaceId },
    include: {
      widgets: {
        include: {
          dataset: { select: { id: true, name: true, schema: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!dashboard) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }

  return NextResponse.json(dashboard);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; dashboardId: string }> }
) {
  const { workspaceId, dashboardId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, workspaceId },
  });

  if (!dashboard) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }

  await prisma.dashboard.delete({ where: { id: dashboardId } });

  return NextResponse.json({ success: true });
}
