import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { analyticsEvents } from "@db/schema";
import { count } from "drizzle-orm";

export const healthRouter = createRouter({
  check: publicQuery.query(async () => {
    const db = getDb();
    const totalResult = await db.select({ count: count() }).from(analyticsEvents);
    const used = process.memoryUsage();

    return {
      status: "healthy",
      uptime: process.uptime(),
      memory: {
        used: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
      },
      processedEventCount: totalResult[0]?.count || 0,
      timestamp: new Date().toISOString(),
    };
  }),
});
