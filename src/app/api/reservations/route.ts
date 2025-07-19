import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || !user.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const reservations = await prisma.reservation.findMany({
    where: { userId: Number(user.id) },
    include: { hospital: true },
    orderBy: { reservedAt: "desc" },
  });
  return NextResponse.json({ reservations });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || !user.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { hospitalId, reservedAt, memo } = await req.json();
  if (!hospitalId || !reservedAt) {
    return NextResponse.json({ error: "병원과 예약일시는 필수입니다." }, { status: 400 });
  }
  const hospital = await prisma.hospital.findUnique({ where: { id: Number(hospitalId) } });
  if (!hospital) {
    return NextResponse.json({ error: "존재하지 않는 병원입니다." }, { status: 404 });
  }
  const reservation = await prisma.reservation.create({
    data: {
      userId: Number(user.id),
      hospitalId: Number(hospitalId),
      reservedAt: new Date(reservedAt),
      memo,
    },
  });
  return NextResponse.json({ reservation });
} 