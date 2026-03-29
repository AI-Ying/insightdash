import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";
import { registerSchema } from "@/lib/validations";
import { generateUniqueSlug } from "@/lib/utils";
import { success, errors } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errors.validationError(parsed.error.issues[0].message);
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errors.badRequest("该邮箱已被注册");
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Auto-create default workspace
    const workspaceName = `${name}'s Workspace`;
    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        slug: generateUniqueSlug(workspaceName),
      },
    });

    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: "OWNER",
      },
    });

    return success(
      { message: "注册成功", workspaceSlug: workspace.slug },
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    return errors.serverError("注册失败，请稍后重试");
  }
}
