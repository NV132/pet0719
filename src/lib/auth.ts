import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function verifyToken(token?: string): JwtPayload | null {
  if (!token) return null;
  // Bearer 접두사 제거
  const realToken = token.startsWith("Bearer ") ? token.slice(7) : token;
  try {
    return jwt.verify(realToken, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
} 