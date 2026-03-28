import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceMembership } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; datasourceId: string }> }
) {
  const { workspaceId, datasourceId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const dataSource = await prisma.dataSource.findFirst({
    where: { id: datasourceId, workspaceId },
    include: {
      datasets: { select: { id: true, name: true, schema: true, createdAt: true } },
    },
  });

  if (!dataSource) {
    return NextResponse.json({ error: "Data source not found" }, { status: 404 });
  }

  return NextResponse.json(dataSource);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; datasourceId: string }> }
) {
  const { workspaceId, datasourceId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const dataSource = await prisma.dataSource.findFirst({
    where: { id: datasourceId, workspaceId },
  });

  if (!dataSource) {
    return NextResponse.json({ error: "Data source not found" }, { status: 404 });
  }

  await prisma.dataSource.delete({ where: { id: datasourceId } });

  return NextResponse.json({ success: true });
}
