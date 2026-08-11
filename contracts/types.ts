import { z } from "zod";

export const UserRole = z.enum(["admin", "analyst", "viewer"]);
export type UserRole = z.infer<typeof UserRole>;

export const AnalyticsEventSchema = z.object({
  id: z.string().min(1),
  eventType: z.string().min(1).max(100),
  sessionId: z.string().min(1).max(100),
  userId: z.string().max(100).optional(),
  source: z.string().min(1).max(100),
  metadata: z.record(z.string(), z.unknown()).default({}),
  processed: z.number().int().default(0),
  createdAt: z.date(),
});

export const CreateEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  sessionId: z.string().min(1).max(100),
  userId: z.string().max(100).optional(),
  source: z.string().min(1).max(100),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const EventFilterSchema = z.object({
  eventType: z.string().optional(),
  source: z.string().optional(),
  sessionId: z.string().optional(),
  processed: z.number().int().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(25),
});

export const SummaryResponseSchema = z.object({
  totalEvents: z.number(),
  totalSessions: z.number(),
  activeSessions: z.number(),
  eventsPerMinute: z.number(),
  topEventTypes: z.array(z.object({ type: z.string(), count: z.number() })),
  topSources: z.array(z.object({ source: z.string(), count: z.number() })),
  recentEventsCount: z.number(),
  processedCount: z.number(),
  unprocessedCount: z.number(),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const TimeSeriesPointSchema = z.object({
  timestamp: z.string(),
  count: z.number(),
});

export const TimeSeriesSchema = z.array(TimeSeriesPointSchema);

export const PieChartDataSchema = z.array(
  z.object({ name: z.string(), value: z.number() })
);

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
    role: UserRole,
  }),
});

export const HealthResponseSchema = z.object({
  status: z.string(),
  uptime: z.number(),
  memory: z.object({
    used: z.number(),
    total: z.number(),
  }),
  timestamp: z.string(),
});
