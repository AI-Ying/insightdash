import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SampleDataLoader } from "@/components/workspace/sample-data-loader";

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
      dashboards: {
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { widgets: true } } },
      },
      dataSources: {
        take: 1,
        where: { name: "工厂传感器示例数据" },
        select: { id: true },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    notFound();
  }

  const hasSampleData = workspace.dataSources.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{workspace.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`/w/${slug}/dashboards`}
          className="rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-200 hover:shadow-md transition-all"
        >
          <p className="text-sm text-slate-500">仪表板</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{workspace._count.dashboards}</p>
        </Link>
        <Link
          href={`/w/${slug}/datasources`}
          className="rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-200 hover:shadow-md transition-all"
        >
          <p className="text-sm text-slate-500">数据源</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{workspace._count.dataSources}</p>
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">成员</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{workspace.members.length}</p>
        </div>
      </div>

      {/* Sample Data Loader - only show if no dashboards exist */}
      {workspace._count.dashboards === 0 && (
        <SampleDataLoader
          workspaceId={workspace.id}
          slug={slug}
          hasData={hasSampleData}
        />
      )}

      {/* Recent Dashboards */}
      {workspace.dashboards.length > 0 ? (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">最近的仪表板</h2>
            <Link
              href={`/w/${slug}/dashboards`}
              className="text-sm text-blue-600 hover:underline"
            >
              查看全部
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspace.dashboards.map((d) => (
              <Link
                key={d.id}
                href={`/w/${slug}/dashboards/${d.id}`}
                className="rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-slate-900">{d.title}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {d._count.widgets} 个组件 &middot; 更新于{" "}
                  {new Date(d.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-700">暂无仪表板</h2>
          <p className="mt-2 text-sm text-slate-500">
            创建你的第一个仪表板来可视化数据。
          </p>
          <Link
            href={`/w/${slug}/dashboards`}
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            创建仪表板
          </Link>
        </div>
      )}
    </div>
  );
}
