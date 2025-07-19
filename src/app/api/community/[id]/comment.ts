import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

// GET: 댓글/대댓글 목록 (parentId 없으면 최상위, 있으면 해당 parent의 대댓글)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const postId = Number(params.id);
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  const where: any = { postId };
  if (parentId) where.parentCommentId = Number(parentId);
  else where.parentCommentId = null;
  const comments = await prisma.communityComment.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true } }, childComments: true },
  });
  return NextResponse.json({ comments });
}

// POST: 댓글/대댓글 생성
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const postId = Number(params.id);
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || !user.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { content, parentCommentId } = await req.json();
  if (!content) {
    return NextResponse.json({ error: "내용은 필수입니다." }, { status: 400 });
  }
  const comment = await prisma.communityComment.create({
    data: {
      postId,
      userId: Number(user.id),
      content,
      parentCommentId: parentCommentId ? Number(parentCommentId) : undefined,
    },
    include: { user: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ comment });
} 