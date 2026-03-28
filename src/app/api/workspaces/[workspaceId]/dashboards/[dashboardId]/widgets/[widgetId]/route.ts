import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceMembership } from "@/lib/api-utils";
import { widgetUpdateSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      workspaceId: string;
      dashboardId: string;
      widgetId: string;
    }>;
  }
) {
  const { workspaceId, dashboardId, widgetId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const existing = await prisma.widget.findFirst({
    where: { id: widgetId, dashboardId },
    include: { dashboard: { select: { workspaceId: true } } },
  });

  if (!existing || existing.dashboard.workspaceId !== workspaceId) {
    return NextResponse.json({ error: "Widget not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = widgetUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.config !== undefined) updateData.config = parsed.data.config;
  if (parsed.data.position !== undefined) updateData.position = parsed.data.position;
  if (parsed.data.datasetId !== undefined) updateData.datasetId = parsed.data.datasetId;

  const widget = await prisma.widget.update({
    where: { id: widgetId },
    data: updateData,
    include: {
      dataset: { select: { id: true, name: true, schema: true } },
    },
  });

  return NextResponse.json(widget);
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      workspaceId: string;
      dashboardId: string;
      widgetId: string;
    }>;
  }
) {
  const { workspaceId, dashboardId, widgetId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const existing = await prisma.widget.findFirst({
    where: { id: widgetId, dashboardId },
    include: { dashboard: { select: { workspaceId: true } } },
  });

  if (!existing || existing.dashboard.workspaceId !== workspaceId) {
    return NextResponse.json({ error: "Widget not found" }, { status: 404 });
  }

  await prisma.widget.delete({ where: { id: widgetId } });

  return NextResponse.json({ success: true });
}
