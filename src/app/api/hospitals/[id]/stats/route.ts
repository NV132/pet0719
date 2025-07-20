import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req, context) {
  const hospitalId = Number(context.params.id);
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
  // 전체 통계
  const [reviewCount, avg, reservationCount] = await Promise.all([
    prisma.review.count({ where: { hospitalId } }),
    prisma.review.aggregate({ where: { hospitalId }, _avg: { rating: true } }),
    prisma.reservation.count({ where: { hospitalId } }),
  ]);
  // 월별 통계
  const monthlyReservations = await prisma.$queryRawUnsafe(
    `SELECT strftime('%Y-%m', reservedAt) as month, COUNT(*) as count FROM Reservation WHERE hospitalId = ? GROUP BY month ORDER BY month`,
    hospitalId
  );
  const monthlyReviews = await prisma.$queryRawUnsafe(
    `SELECT strftime('%Y-%m', createdAt) as month, COUNT(*) as count, AVG(rating) as avgRating FROM Review WHERE hospitalId = ? GROUP BY month ORDER BY month`,
    hospitalId
  );
  return NextResponse.json({ stats: {
    reviewCount,
    avgRating: avg._avg.rating,
    reservationCount,
    monthlyReservations,
    monthlyReviews,
  }});
} 