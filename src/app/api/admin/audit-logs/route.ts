import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

// GET: 감사 로그 목록 (관리자: 전체, 병원업체: 본인 관련만)
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  let where: any = {};
  if (user.role === "admin") {
    // 전체 감사 로그
  } else if (user.role === "hospitalAdmin") {
    where = { OR: [ { userId: user.id }, { targetId: user.id, targetType: "user" } ] };
  } else {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
    take: 200 // 최근 200개 제한
  });
  return NextResponse.json({ logs });
} 