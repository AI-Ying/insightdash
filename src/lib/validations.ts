import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "姓名至少2个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(8, "密码至少8个字符")
    .regex(/[A-Z]/, "密码必须包含大写字母")
    .regex(/[a-z]/, "密码必须包含小写字母")
    .regex(/[0-9]/, "密码必须包含数字"),
});

export const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(50, "Workspace name too long"),
});

// ===== Dashboard Schemas =====
export const dashboardSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(500).optional(),
});

export const widgetSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  type: z.enum([
    "LINE_CHART",
    "BAR_CHART",
    "PIE_CHART",
    "AREA_CHART",
    "KPI_CARD",
  ]),
  config: z.object({
    xField: z.string().optional(),
    yField: z.string().optional(),
    yFields: z.array(z.string()).optional(),
    categoryField: z.string().optional(),
    valueField: z.string().optional(),
    aggregation: z.enum(["sum", "avg", "count", "min", "max"]).optional(),
    colors: z.array(z.string()).optional(),
  }),
  position: z.object({
    col: z.number().min(0).max(1),
    row: z.number().min(0),
    w: z.number().min(1).max(2),
    h: z.number().min(1).max(4),
  }),
  datasetId: z.string().optional(),
});

export const widgetUpdateSchema = widgetSchema.partial();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type WorkspaceInput = z.infer<typeof workspaceSchema>;
export type DashboardInput = z.infer<typeof dashboardSchema>;
export type WidgetInput = z.infer<typeof widgetSchema>;
export type WidgetUpdateInput = z.infer<typeof widgetUpdateSchema>;
