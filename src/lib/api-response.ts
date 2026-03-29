import { NextResponse } from "next/server";

/**
 * Standardized API response helper
 */
export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(message: string, code?: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: code || "UNKNOWN_ERROR",
        message,
      },
    },
    { status }
  );
}

// Predefined error factories
export const errors = {
  unauthorized: () => error("未登录或登录已过期", "UNAUTHORIZED", 401),
  forbidden: () => error("无权访问此资源", "FORBIDDEN", 403),
  notFound: (resource = "资源") => error(`${resource}不存在`, "NOT_FOUND", 404),
  badRequest: (message: string) => error(message, "BAD_REQUEST", 400),
  serverError: (message = "服务器内部错误") => error(message, "SERVER_ERROR", 500),
  validationError: (message: string) => error(message, "VALIDATION_ERROR", 422),
};
