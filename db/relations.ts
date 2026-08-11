import { relations } from "drizzle-orm";
import { users, analyticsEvents, eventProcessingQueue } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  events: many(analyticsEvents),
}));

export const analyticsEventsRelations = relations(analyticsEvents, () => ({
  // Events are linked by userId string, not FK
}));

export const eventProcessingQueueRelations = relations(eventProcessingQueue, () => ({
  // Queue items reference events by eventId string
}));
