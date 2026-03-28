import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: {
      members: { where: { userId: session?.user?.id } },
      _count: { select: { dashboards: true, dataSources: true } },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{workspace.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Dashboards</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{workspace._count.dashboards}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Data Sources</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{workspace._count.dataSources}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Members</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{workspace.members.length}</p>
        </div>
      </div>
      {workspace._count.dashboards === 0 && (
        <div className="mt-8 rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-700">No dashboards yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create your first dashboard to start visualizing your data.
          </p>
        </div>
      )}
    </div>
  );
}
