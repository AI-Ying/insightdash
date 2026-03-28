import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceMembership } from "@/lib/api-utils";
import { dashboardSchema } from "@/lib/validations";
import { seedWorkspaceSampleData } from "@/lib/sample-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const dashboards = await prisma.dashboard.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { widgets: true } },
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(dashboards);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const body = await request.json();
  const parsed = dashboardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Ensure sample data is seeded on first dashboard creation
  await seedWorkspaceSampleData(workspaceId);

  const dashboard = await prisma.dashboard.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      workspaceId,
      createdById: result.session.user!.id!,
    },
    include: {
      _count: { select: { widgets: true } },
    },
  });

  return NextResponse.json(dashboard, { status: 201 });
}
