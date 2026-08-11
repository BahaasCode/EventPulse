import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import jwt from "jsonwebtoken";
import { env } from "./lib/env";

export type UserRole = "admin" | "analyst" | "viewer";

export type AuthenticatedUser = {
  id: number;
  email: string;
  name: string;
  role: UserRole;
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user: AuthenticatedUser | null;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const authHeader = opts.req.headers.get("authorization");
  let user: AuthenticatedUser | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, env.jwtSecret, { clockTolerance: 60 }) as {
        sub: string;
        email: string;
        name: string;
        role: UserRole;
      };
      user = {
        id: parseInt(decoded.sub, 10),
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };
    } catch {
      user = null;
    }
  }

  return { req: opts.req, resHeaders: opts.resHeaders, user };
}
