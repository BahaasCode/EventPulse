import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { env } from "../lib/env";
import { TRPCError } from "@trpc/server";
import { RegisterSchema, LoginSchema } from "@contracts/types";

export const authRouter = createRouter({
  register: publicQuery
    .input(RegisterSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
      }
      const passwordHash = await bcrypt.hash(input.password, 12);
      const result = await db.insert(users).values({
        email: input.email,
        passwordHash,
        name: input.name,
        role: "viewer",
      });
      const userId = Number(result[0].insertId);
      const token = jwt.sign(
        { sub: String(userId), email: input.email, name: input.name, role: "viewer" },
        env.jwtSecret,
        { expiresIn: "7d" }
      );
      return {
        token,
        user: { id: userId, email: input.email, name: input.name, role: "viewer" as const },
      };
    }),

  login: publicQuery
    .input(LoginSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const found = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (found.length === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      const user = found[0];
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      const token = jwt.sign(
        { sub: String(user.id), email: user.email, name: user.name, role: user.role },
        env.jwtSecret,
        { expiresIn: "7d" }
      );
      return {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
    };
  }),
});
