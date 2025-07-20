import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const hospitalId = Number(params.id);
  if (!hospitalId) {
    return NextResponse.json({ error: "병원 ID가 필요합니다." }, { status: 400 });
  }
  // 권한 체크: hospitalAdmin은 본인 병원만, admin은 전체 허용
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (user && user.role === "hospitalAdmin") {
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital || hospital.ownerId !== user.id) {
      return NextResponse.json({ error: "본인 병원만 조회할 수 있습니다." }, { status: 403 });
    }
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const where: Record<string, unknown> = { hospitalId };
  if (status) where.status = status;
  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { reservedAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ reservations });
} 