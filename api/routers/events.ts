import { z } from "zod";
import { createRouter, publicQuery, authenticatedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { analyticsEvents, eventProcessingQueue } from "@db/schema";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";
import { CreateEventSchema, EventFilterSchema } from "@contracts/types";
import { TRPCError } from "@trpc/server";

export const eventsRouter = createRouter({
  create: publicQuery
    .input(CreateEventSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const now = new Date();
      await db.insert(analyticsEvents).values({
        id,
        eventType: input.eventType,
        sessionId: input.sessionId,
        userId: input.userId || null,
        source: input.source,
        metadata: input.metadata,
        processed: 0,
        createdAt: now,
      });
      await db.insert(eventProcessingQueue).values({
        eventId: id,
        status: "pending",
        retryCount: 0,
        createdAt: now,
      });
      const event = await db.select().from(analyticsEvents).where(eq(analyticsEvents.id, id)).limit(1);
      return event[0];
    }),

  list: publicQuery
    .input(EventFilterSchema.optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = input || { page: 1, limit: 25 };
      const conditions: ReturnType<typeof and>[] = [];

      if (filters.eventType) conditions.push(eq(analyticsEvents.eventType, filters.eventType));
      if (filters.source) conditions.push(eq(analyticsEvents.source, filters.source));
      if (filters.sessionId) conditions.push(eq(analyticsEvents.sessionId, filters.sessionId));
      if (filters.processed !== undefined) conditions.push(eq(analyticsEvents.processed, filters.processed));
      if (filters.startDate) conditions.push(gte(analyticsEvents.createdAt, new Date(filters.startDate)));
      if (filters.endDate) conditions.push(lte(analyticsEvents.createdAt, new Date(filters.endDate)));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const offset = ((filters.page || 1) - 1) * (filters.limit || 25);

      const items = await db
        .select()
        .from(analyticsEvents)
        .where(whereClause)
        .orderBy(desc(analyticsEvents.createdAt))
        .limit(filters.limit || 25)
        .offset(offset);

      const totalResult = await db
        .select({ count: count() })
        .from(analyticsEvents)
        .where(whereClause);

      return {
        items,
        total: totalResult[0]?.count || 0,
        page: filters.page || 1,
        limit: filters.limit || 25,
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const event = await db.select().from(analyticsEvents).where(eq(analyticsEvents.id, input.id)).limit(1);
      if (event.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }
      return event[0];
    }),

  getRecent: publicQuery
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit || 20;
      return db
        .select()
        .from(analyticsEvents)
        .orderBy(desc(analyticsEvents.createdAt))
        .limit(limit);
    }),

  processEvent: authenticatedQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(analyticsEvents)
        .set({ processed: 1, processedAt: new Date() })
        .where(eq(analyticsEvents.id, input.id));
      await db
        .update(eventProcessingQueue)
        .set({ status: "completed", processedAt: new Date() })
        .where(eq(eventProcessingQueue.eventId, input.id));
      return { success: true };
    }),

  delete: authenticatedQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(eventProcessingQueue).where(eq(eventProcessingQueue.eventId, input.id));
      await db.delete(analyticsEvents).where(eq(analyticsEvents.id, input.id));
      return { success: true };
    }),
});
