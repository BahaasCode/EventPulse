import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./routers/auth";
import { eventsRouter } from "./routers/events";
import { analyticsRouter } from "./routers/analytics";
import { healthRouter } from "./routers/health";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  events: eventsRouter,
  analytics: analyticsRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
