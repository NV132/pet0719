import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

// GET: 유저 목록 (관리자만)
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
  });
  return NextResponse.json({ users });
}

// PATCH: 유저 권한 변경 (관리자만, 감사 로그 기록)
export async function PATCH(req: Request) {
  const auth = req.headers.get("authorization");
  const admin = verifyToken(auth || undefined) as JwtPayload | null;
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  const { userId, newRole } = await req.json();
  if (!userId || !newRole) {
    return NextResponse.json({ error: "userId, newRole이 필요합니다." }, { status: 400 });
  }
  if (!['user', 'admin', 'hospitalAdmin'].includes(newRole)) {
    return NextResponse.json({ error: "허용되지 않는 role입니다." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) {
    return NextResponse.json({ error: "존재하지 않는 유저입니다." }, { status: 404 });
  }
  const prevRole = user.role;
  if (prevRole === newRole) {
    return NextResponse.json({ error: "이미 해당 권한입니다." }, { status: 400 });
  }
  await prisma.user.update({ where: { id: user.id }, data: { role: newRole } });
  // 감사 로그 기록
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: newRole === 'user' ? 'role_revoke' : 'role_grant',
      targetId: user.id,
      targetType: 'user',
      detail: `role: ${prevRole} → ${newRole}`
    }
  });
  return NextResponse.json({ ok: true });
} 