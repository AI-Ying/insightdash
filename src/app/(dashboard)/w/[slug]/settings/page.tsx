import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  const currentMember = workspace.members.find((m) => m.userId === session?.user?.id);
  if (!currentMember) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Workspace Settings</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">General</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <p className="text-sm text-slate-900">{workspace.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
            <p className="text-sm text-slate-500">{workspace.slug}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
            <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {workspace.plan}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Members</h2>
        <div className="space-y-3">
          {workspace.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                  {member.user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{member.user.name}</p>
                  <p className="text-xs text-slate-500">{member.user.email}</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
