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
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;
  const order = searchParams.get("order") || "desc";

  const [reviews, total, avg] = await Promise.all([
    prisma.review.findMany({
      where: { hospitalId },
      orderBy: { createdAt: order === "asc" ? "asc" : "desc" },
      skip,
      take: limit,
      include: { user: true },
    }),
    prisma.review.count({ where: { hospitalId } }),
    prisma.review.aggregate({ where: { hospitalId }, _avg: { rating: true } })
  ]);
  return NextResponse.json({ reviews, total, avgRating: avg._avg.rating });
} 