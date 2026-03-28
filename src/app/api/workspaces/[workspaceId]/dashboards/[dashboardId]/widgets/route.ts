import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceMembership } from "@/lib/api-utils";
import { widgetSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; dashboardId: string }> }
) {
  const { workspaceId, dashboardId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const widgets = await prisma.widget.findMany({
    where: { dashboardId },
    include: {
      dataset: { select: { id: true, name: true, schema: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(widgets);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; dashboardId: string }> }
) {
  const { workspaceId, dashboardId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  // Verify dashboard belongs to workspace
  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, workspaceId },
  });
  if (!dashboard) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = widgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const widget = await prisma.widget.create({
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      config: JSON.parse(JSON.stringify(parsed.data.config)),
      position: JSON.parse(JSON.stringify(parsed.data.position)),
      datasetId: parsed.data.datasetId || null,
      dashboardId,
    },
    include: {
      dataset: { select: { id: true, name: true, schema: true } },
    },
  });

  return NextResponse.json(widget, { status: 201 });
}
