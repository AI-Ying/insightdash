/**
 * API Data Source Templates
 * Built-in templates for quick data source creation
 */

export interface ApiTemplate {
  id: string;
  category: string;
  name: string;
  description: string;
  url: string;
  method: "GET";
  responsePath: string;
}

export const API_TEMPLATES: ApiTemplate[] = [
  // ========== Weather & Geography ==========
  {
    id: "weather-beijing",
    category: "天气/地理",
    name: "全球城市天气",
    description: "实时天气数据（温度、湿度、风速）",
    url: "https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    method: "GET",
    responsePath: "",
  },
  {
    id: "world-countries",
    category: "天气/地理",
    name: "世界各国信息",
    description: "200+国家的人口、面积、地区、首都",
    url: "https://restcountries.com/v3.1/all?fields=name,population,area,region,capital",
    method: "GET",
    responsePath: "",
  },

  // ========== Statistics & Government ==========
  {
    id: "github-trending",
    category: "统计/政府",
    name: "GitHub 热门项目",
    description: "按 star 排序的热门仓库 TOP 20",
    url: "https://api.github.com/search/repositories?q=stars:>1000&sort=stars&per_page=20",
    method: "GET",
    responsePath: "items",
  },
  {
    id: "github-repo",
    category: "统计/政府",
    name: "GitHub 单个项目详情",
    description: "如 Facebook React 项目统计",
    url: "https://api.github.com/repos/facebook/react",
    method: "GET",
    responsePath: "",
  },

  // ========== Utilities ==========
  {
    id: "random-users",
    category: "实用工具",
    name: "随机用户",
    description: "100条随机用户数据（姓名、年龄、性别、城市）",
    url: "https://randomuser.me/api/?results=100",
    method: "GET",
    responsePath: "results",
  },
  {
    id: "dog-breeds",
    category: "实用工具",
    name: "狗狗品种列表",
    description: "各品种狗狗信息",
    url: "https://dog.ceo/api/breeds/list/all",
    method: "GET",
    responsePath: "message",
  },
  {
    id: "cat-facts",
    category: "实用工具",
    name: "猫咪趣闻",
    description: "随机猫咪冷知识",
    url: "https://catfact.ninja/fact",
    method: "GET",
    responsePath: "",
  },
];

export const TEMPLATE_CATEGORIES = [
  "天气/地理",
  "统计/政府",
  "实用工具",
];

// =============================================================================
// Application Constants
// =============================================================================

export const APP_NAME = "InsightDash";
export const APP_URL = process.env.NEXTAUTH_URL || "https://insightdash-faa2.onrender.com";

/**
 * Sample data URLs (used for demo/development)
 */
export const SAMPLE_DATA = {
  /** Factory sensors sample CSV */
  SENSORS: "/sample/factory_sensors.csv",
  /** Quality monitoring sample CSV */
  QUALITY: "/sample/quality-sample.csv",
} as const;

/**
 * API timeout settings (in milliseconds)
 */
export const API_TIMEOUT = {
  DEFAULT: 10000,    // 10 seconds
  UPLOAD: 60000,    // 60 seconds for file uploads
  TEST: 15000,      // 15 seconds for connection tests
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * CSV upload constraints
 */
export const CSV_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ROWS: 10000,
} as const;
