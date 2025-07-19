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
  const reviews = await prisma.review.findMany({
    where: { userId: Number(user.id) },
    include: { hospital: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reviews });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || !user.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { hospitalId, rating, content } = await req.json();
  if (!hospitalId || !rating || !content) {
    return NextResponse.json({ error: "병원, 평점, 내용은 필수입니다." }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "평점은 1~5점이어야 합니다." }, { status: 400 });
  }
  const hospital = await prisma.hospital.findUnique({ where: { id: Number(hospitalId) } });
  if (!hospital) {
    return NextResponse.json({ error: "존재하지 않는 병원입니다." }, { status: 404 });
  }
  const review = await prisma.review.create({
    data: {
      userId: Number(user.id),
      hospitalId: Number(hospitalId),
      rating,
      content,
    },
  });
  return NextResponse.json({ review });
} 