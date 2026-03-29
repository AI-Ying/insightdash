"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, CheckCircle, User, Lock, Trash2 } from "lucide-react";

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState<"profile" | "workspace" | "danger">("profile");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">设置</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
          <User className="h-4 w-4" />
          个人设置
        </TabButton>
        <TabButton active={activeTab === "workspace"} onClick={() => setActiveTab("workspace")}>
          <Lock className="h-4 w-4" />
          工作空间
        </TabButton>
        <TabButton active={activeTab === "danger"} onClick={() => setActiveTab("danger")}>
          <AlertCircle className="h-4 w-4" />
          危险区域
        </TabButton>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && <ProfileSettings user={session?.user} />}

      {/* Workspace Tab */}
      {activeTab === "workspace" && <WorkspaceSettings />}

      {/* Danger Zone Tab */}
      {activeTab === "danger" && <DangerZone />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function ProfileSettings({ user }: { user?: { name?: string | null; email?: string | null } | null }) {
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "保存成功" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "保存失败" });
      }
    } catch {
      setMessage({ type: "error", text: "网络错误" });
    }
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">个人信息</h2>

      {message && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
          />
          <p className="mt-1 text-xs text-slate-400">邮箱地址无法自行修改</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}

function WorkspaceSettings() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">工作空间设置</h2>
      <p className="text-sm text-slate-500">
        工作空间管理功能开发中...
      </p>
    </div>
  );
}

function DangerZone() {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") return;
    if (!confirm("确定要删除账号吗？此操作不可恢复！")) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/";
      }
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-700 mb-4">危险区域</h2>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-900 mb-2">删除账号</h3>
        <p className="text-sm text-slate-500 mb-4">
          删除账号将永久删除您的所有数据，包括工作空间、仪表板和数据源。此操作不可恢复。
        </p>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="输入 DELETE 确认"
            className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
          <button
            onClick={handleDeleteAccount}
            disabled={confirmText !== "DELETE" || deleting}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "删除中..." : "删除账号"}
          </button>
        </div>
      </div>
    </div>
  );
}
