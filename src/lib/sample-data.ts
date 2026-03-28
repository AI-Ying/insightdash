import { prisma } from "@/lib/prisma";

// ===== Sample Data Definitions =====

const MONTHLY_REVENUE = {
  name: "Monthly Revenue",
  columns: [
    { name: "month", type: "string" as const },
    { name: "revenue", type: "number" as const },
    { name: "expenses", type: "number" as const },
    { name: "profit", type: "number" as const },
  ],
  rows: [
    { month: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
    { month: "Feb", revenue: 52000, expenses: 34000, profit: 18000 },
    { month: "Mar", revenue: 48000, expenses: 31000, profit: 17000 },
    { month: "Apr", revenue: 61000, expenses: 36000, profit: 25000 },
    { month: "May", revenue: 55000, expenses: 33000, profit: 22000 },
    { month: "Jun", revenue: 67000, expenses: 38000, profit: 29000 },
    { month: "Jul", revenue: 72000, expenses: 41000, profit: 31000 },
    { month: "Aug", revenue: 69000, expenses: 39000, profit: 30000 },
    { month: "Sep", revenue: 78000, expenses: 43000, profit: 35000 },
    { month: "Oct", revenue: 82000, expenses: 45000, profit: 37000 },
    { month: "Nov", revenue: 91000, expenses: 48000, profit: 43000 },
    { month: "Dec", revenue: 98000, expenses: 52000, profit: 46000 },
  ],
};

const PRODUCT_CATEGORIES = {
  name: "Product Categories",
  columns: [
    { name: "category", type: "string" as const },
    { name: "sales", type: "number" as const },
    { name: "orders", type: "number" as const },
    { name: "returns", type: "number" as const },
  ],
  rows: [
    { category: "Electronics", sales: 124000, orders: 1850, returns: 142 },
    { category: "Clothing", sales: 89000, orders: 3200, returns: 280 },
    { category: "Home & Garden", sales: 67000, orders: 1400, returns: 95 },
    { category: "Sports", sales: 45000, orders: 980, returns: 67 },
    { category: "Books", sales: 23000, orders: 4500, returns: 120 },
    { category: "Toys", sales: 34000, orders: 1200, returns: 88 },
  ],
};

const WEBSITE_TRAFFIC = {
  name: "Website Traffic",
  columns: [
    { name: "month", type: "string" as const },
    { name: "visitors", type: "number" as const },
    { name: "pageViews", type: "number" as const },
    { name: "bounceRate", type: "number" as const },
  ],
  rows: [
    { month: "Jan", visitors: 12000, pageViews: 45000, bounceRate: 42 },
    { month: "Feb", visitors: 14500, pageViews: 52000, bounceRate: 39 },
    { month: "Mar", visitors: 13200, pageViews: 48000, bounceRate: 41 },
    { month: "Apr", visitors: 16800, pageViews: 61000, bounceRate: 37 },
    { month: "May", visitors: 15500, pageViews: 55000, bounceRate: 38 },
    { month: "Jun", visitors: 18900, pageViews: 68000, bounceRate: 35 },
    { month: "Jul", visitors: 21000, pageViews: 74000, bounceRate: 33 },
    { month: "Aug", visitors: 19500, pageViews: 70000, bounceRate: 34 },
    { month: "Sep", visitors: 22800, pageViews: 82000, bounceRate: 31 },
    { month: "Oct", visitors: 24500, pageViews: 88000, bounceRate: 30 },
    { month: "Nov", visitors: 27000, pageViews: 96000, bounceRate: 28 },
    { month: "Dec", visitors: 29500, pageViews: 105000, bounceRate: 27 },
  ],
};

const SAMPLE_DATASETS = [MONTHLY_REVENUE, PRODUCT_CATEGORIES, WEBSITE_TRAFFIC];

/**
 * Seeds a workspace with sample DataSource + Datasets so users can
 * immediately create dashboards with charts after registration.
 */
export async function seedWorkspaceSampleData(workspaceId: string) {
  // Check if sample data source already exists
  const existing = await prisma.dataSource.findFirst({
    where: { workspaceId, name: "Sample Data" },
  });
  if (existing) return existing;

  const dataSource = await prisma.dataSource.create({
    data: {
      name: "Sample Data",
      type: "CSV",
      config: { source: "built-in-samples" },
      workspaceId,
      datasets: {
        create: SAMPLE_DATASETS.map((ds) => ({
          name: ds.name,
          schema: { columns: ds.columns, rows: ds.rows },
        })),
      },
    },
    include: { datasets: true },
  });

  return dataSource;
}
