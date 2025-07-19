import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: { id: string, reservationId: string } }) {
  const hospitalId = Number(params.id);
  const reservationId = Number(params.reservationId);
  const { status } = await req.json();
  if (!hospitalId || !reservationId || !status) {
    return NextResponse.json({ error: "병원ID, 예약ID, 상태가 필요합니다." }, { status: 400 });
  }
  // 권한 체크: hospitalAdmin은 본인 병원만, admin은 전체 허용
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || (user.role !== "admin" && user.role !== "hospitalAdmin")) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId }, include: { hospital: true } });
  if (!reservation || reservation.hospitalId !== hospitalId) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }
  if (user.role === "hospitalAdmin") {
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital || hospital.ownerId !== user.id) {
      return NextResponse.json({ error: "본인 병원 예약만 변경할 수 있습니다." }, { status: 403 });
    }
  }
  const updated = await prisma.reservation.update({ where: { id: reservationId }, data: { status } });
  return NextResponse.json({ reservation: updated });
} 