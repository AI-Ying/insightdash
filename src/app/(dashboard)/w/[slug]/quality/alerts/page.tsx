"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Bell, Trash2, Edit2, AlertTriangle, CheckCircle } from "lucide-react";

interface AlertRule {
  id: string;
  name: string;
  metric: "goodRate" | "defectCount" | "defectRate";
  operator: "<" | ">" | "<=" | ">=";
  threshold: number;
  workshop?: string;
  enabled: boolean;
  notifyEmail: boolean;
  notifyWechat: boolean;
}

const METRIC_LABELS: Record<string, string> = {
  goodRate: "良品率",
  defectCount: "不良品数",
  defectRate: "不良率",
};

const DEFAULT_RULES: AlertRule[] = [
  {
    id: "1",
    name: "良品率过低告警",
    metric: "goodRate",
    operator: "<",
    threshold: 95,
    enabled: true,
    notifyEmail: true,
    notifyWechat: true,
  },
  {
    id: "2",
    name: "不良品突增告警",
    metric: "defectCount",
    operator: ">",
    threshold: 10,
    enabled: true,
    notifyEmail: false,
    notifyWechat: true,
  },
];

export default function AlertConfigPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [rules, setRules] = useState<AlertRule[]>(DEFAULT_RULES);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formData, setFormData] = useState<Partial<AlertRule>>({
    name: "",
    metric: "goodRate",
    operator: "<",
    threshold: 95,
    enabled: true,
    notifyEmail: true,
    notifyWechat: true,
  });

  // Mock alert history
  const [alertHistory] = useState([
    { id: "1", timestamp: "2026-03-29 14:30", rule: "良品率过低告警", workshop: "压铸车间", value: 94.2, acknowledged: false },
    { id: "2", timestamp: "2026-03-29 10:15", rule: "不良品突增告警", workshop: "压铸车间", value: 12, acknowledged: true },
    { id: "3", timestamp: "2026-03-28 16:45", rule: "良品率过低告警", workshop: "质检车间", value: 93.8, acknowledged: true },
  ]);

  const handleSave = () => {
    if (!formData.name || !formData.threshold) return;

    if (editingRule) {
      setRules(rules.map((r) => (r.id === editingRule.id ? { ...r, ...formData } as AlertRule : r)));
    } else {
      const newRule: AlertRule = {
        id: Date.now().toString(),
        name: formData.name!,
        metric: formData.metric || "goodRate",
        operator: formData.operator || "<",
        threshold: formData.threshold!,
        workshop: formData.workshop,
        enabled: formData.enabled ?? true,
        notifyEmail: formData.notifyEmail ?? false,
        notifyWechat: formData.notifyWechat ?? false,
      };
      setRules([...rules, newRule]);
    }
    setShowModal(false);
    setEditingRule(null);
    setFormData({ name: "", metric: "goodRate", operator: "<", threshold: 95, enabled: true, notifyEmail: true, notifyWechat: true });
  };

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData(rule);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const toggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/w/${slug}/quality`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回质量看板
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">告警配置</h1>
            <p className="text-sm text-slate-500 mt-1">设置质量告警规则，异常时及时通知</p>
          </div>
          <button
            onClick={() => { setEditingRule(null); setShowModal(true); }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加规则
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Rules */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-600" />
            告警规则
          </h2>
          
          {rules.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无告警规则</p>
              <p className="text-sm">点击上方按钮添加</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className={`p-4 rounded-lg border ${rule.enabled ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleRule(rule.id)} className={`w-10 h-6 rounded-full transition-colors ${rule.enabled ? "bg-blue-600" : "bg-slate-300"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${rule.enabled ? "translate-x-5" : "translate-x-1"}`} />
                      </button>
                      <div>
                        <div className="font-medium text-slate-900">{rule.name}</div>
                        <div className="text-sm text-slate-500">
                          {METRIC_LABELS[rule.metric]} {rule.operator} {rule.threshold}
                          {rule.metric === "goodRate" && "%"}
                          {rule.workshop && ` (${rule.workshop})`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${rule.notifyWechat ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                        微信
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${rule.notifyEmail ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}>
                        邮件
                      </span>
                      <button onClick={() => handleEdit(rule)} className="p-1 text-slate-400 hover:text-slate-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(rule.id)} className="p-1 text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert History */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
            告警历史
          </h2>
          
          {alertHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无告警记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertHistory.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${alert.acknowledged ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {!alert.acknowledged && <span className="w-2 h-2 bg-amber-500 rounded-full" />}
                        <span className="font-medium text-slate-900">{alert.rule}</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {alert.workshop} · {alert.timestamp}
                      </div>
                      <div className="text-sm mt-1">
                        触发值: <span className="font-medium text-amber-600">{alert.value}</span>
                      </div>
                    </div>
                    {alert.acknowledged ? (
                      <span className="text-xs text-slate-400">已确认</span>
                    ) : (
                      <button className="text-xs text-blue-600 hover:text-blue-700">确认</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editingRule ? "编辑告警规则" : "添加告警规则"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">规则名称</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：良品率过低告警"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">指标</label>
                <select
                  value={formData.metric || "goodRate"}
                  onChange={(e) => setFormData({ ...formData, metric: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="goodRate">良品率</option>
                  <option value="defectCount">不良品数</option>
                  <option value="defectRate">不良率</option>
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">条件</label>
                  <select
                    value={formData.operator || "<"}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="<">小于</option>
                    <option value="<=">小于等于</option>
                    <option value=">">大于</option>
                    <option value=">=">大于等于</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    阈值 {formData.metric === "goodRate" && "(%)"} {formData.metric === "defectRate" && "(%)"}
                  </label>
                  <input
                    type="number"
                    value={formData.threshold || ""}
                    onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">通知方式</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notifyWechat ?? true}
                      onChange={(e) => setFormData({ ...formData, notifyWechat: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded mr-2"
                    />
                    微信
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notifyEmail ?? false}
                      onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded mr-2"
                    />
                    邮件
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditingRule(null); }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
