import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

// POST: 좋아요 추가
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const postId = Number(params.id);
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || !user.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  // 중복 방지
  const exists = await prisma.communityLike.findUnique({ where: { postId_userId: { postId, userId: Number(user.id) } } });
  if (exists) {
    return NextResponse.json({ error: "이미 좋아요를 눌렀습니다." }, { status: 400 });
  }
  const like = await prisma.communityLike.create({
    data: { postId, userId: Number(user.id) },
  });
  return NextResponse.json({ like });
}

// DELETE: 좋아요 취소
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const postId = Number(params.id);
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || !user.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  await prisma.communityLike.deleteMany({ where: { postId, userId: Number(user.id) } });
  return NextResponse.json({ ok: true });
} 