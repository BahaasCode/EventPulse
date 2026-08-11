import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { analyticsEvents } from "@db/schema";
import { eq, desc, count, gte } from "drizzle-orm";

export const analyticsRouter = createRouter({
  summary: publicQuery.query(async () => {
    const db = getDb();
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [totalResult] = await db.select({ count: count() }).from(analyticsEvents);
    const totalEvents = totalResult?.count || 0;

    const sessionsResult = await db
      .selectDistinct({ sessionId: analyticsEvents.sessionId })
      .from(analyticsEvents);
    const totalSessions = sessionsResult.length;

    const activeSessionsResult = await db
      .selectDistinct({ sessionId: analyticsEvents.sessionId })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, fiveMinutesAgo));
    const activeSessions = activeSessionsResult.length;

    const recentResult = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, oneMinuteAgo));
    const eventsPerMinute = recentResult[0]?.count || 0;

    const topEventTypes = await db
      .select({
        type: analyticsEvents.eventType,
        count: count(),
      })
      .from(analyticsEvents)
      .groupBy(analyticsEvents.eventType)
      .orderBy(desc(count()))
      .limit(5);

    const topSources = await db
      .select({
        source: analyticsEvents.source,
        count: count(),
      })
      .from(analyticsEvents)
      .groupBy(analyticsEvents.source)
      .orderBy(desc(count()))
      .limit(5);

    const processedResult = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.processed, 1));
    const processedCount = processedResult[0]?.count || 0;

    const unprocessedResult = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.processed, 0));
    const unprocessedCount = unprocessedResult[0]?.count || 0;

    return {
      totalEvents,
      totalSessions,
      activeSessions,
      eventsPerMinute,
      topEventTypes: topEventTypes.map((t) => ({ type: t.type, count: t.count })),
      topSources: topSources.map((s) => ({ source: s.source, count: s.count })),
      recentEventsCount: totalEvents,
      processedCount,
      unprocessedCount,
    };
  }),

  timeSeries: publicQuery
    .input(
      z.object({
        bucket: z.enum(["minute", "hour", "day"]).default("hour"),
        hours: z.number().int().min(1).max(168).default(24),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const bucket = input?.bucket || "hour";
      const hours = input?.hours || 24;
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

      const events = await db
        .select({
          eventType: analyticsEvents.eventType,
          createdAt: analyticsEvents.createdAt,
        })
        .from(analyticsEvents)
        .where(gte(analyticsEvents.createdAt, cutoff))
        .orderBy(analyticsEvents.createdAt);

      const bucketMap = new Map<string, number>();
      for (const event of events) {
        const date = new Date(event.createdAt);
        let key: string;
        if (bucket === "minute") {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        } else if (bucket === "hour") {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:00`;
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        }
        bucketMap.set(key, (bucketMap.get(key) || 0) + 1);
      }

      const sorted = Array.from(bucketMap.entries()).sort(([a], [b]) => a.localeCompare(b));
      return sorted.map(([timestamp, count]) => ({ timestamp, count }));
    }),

  eventTypeDistribution: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        name: analyticsEvents.eventType,
        value: count(),
      })
      .from(analyticsEvents)
      .groupBy(analyticsEvents.eventType)
      .orderBy(desc(count()))
      .limit(10);
    return result;
  }),

  sourceDistribution: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        name: analyticsEvents.source,
        value: count(),
      })
      .from(analyticsEvents)
      .groupBy(analyticsEvents.source)
      .orderBy(desc(count()))
      .limit(10);
    return result;
  }),

  eventTypes: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .selectDistinct({ eventType: analyticsEvents.eventType })
      .from(analyticsEvents);
    return result.map((r) => r.eventType);
  }),

  sources: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .selectDistinct({ source: analyticsEvents.source })
      .from(analyticsEvents);
    return result.map((r) => r.source);
  }),
});
