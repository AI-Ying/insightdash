import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workspaceSchema } from "@/lib/validations";
import { generateUniqueSlug } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    include: {
      _count: { select: { members: true, dashboards: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(workspaces);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = workspaceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      slug: generateUniqueSlug(parsed.data.name),
    },
  });

  await prisma.workspaceMember.create({
    data: {
      userId: session.user.id,
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });

  return NextResponse.json(workspace, { status: 201 });
}
