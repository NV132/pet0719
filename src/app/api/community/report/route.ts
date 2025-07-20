import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

// GET: 전체 신고 목록(관리자)
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근 가능합니다." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const type = searchParams.get("type"); // post/comment
  const keyword = searchParams.get("keyword") || undefined;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type === "post") where.postId = { not: null };
  if (type === "comment") where.commentId = { not: null };
  if (keyword) where.reason = { contains: keyword };
  const reports = await prisma.communityReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
      post: { select: { id: true, title: true } },
      comment: { select: { id: true, content: true } },
    },
  });
  return NextResponse.json({ reports });
}

// POST: 신고 생성(글/댓글)
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || !user.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { postId, commentId, reason } = await req.json();
  if (!reason || (!postId && !commentId)) {
    return NextResponse.json({ error: "신고 사유와 대상이 필요합니다." }, { status: 400 });
  }
  const report = await prisma.communityReport.create({
    data: {
      postId: postId ? Number(postId) : undefined,
      commentId: commentId ? Number(commentId) : undefined,
      userId: Number(user.id),
      reason,
    },
  });
  return NextResponse.json({ report });
} 