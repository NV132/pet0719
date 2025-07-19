import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

// PUT: 댓글/대댓글 수정
export async function PUT(req: Request, { params }: { params: { id: string; commentId: string } }) {
  const commentId = Number(params.commentId);
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || !user.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const comment = await prisma.communityComment.findUnique({ where: { id: commentId } });
  if (!comment) {
    return NextResponse.json({ error: "존재하지 않는 댓글입니다." }, { status: 404 });
  }
  if (comment.userId !== Number(user.id)) {
    return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
  }
  const { content } = await req.json();
  if (!content) {
    return NextResponse.json({ error: "내용은 필수입니다." }, { status: 400 });
  }
  const updated = await prisma.communityComment.update({
    where: { id: commentId },
    data: { content },
  });
  return NextResponse.json({ comment: updated });
}

// DELETE: 댓글/대댓글 삭제
export async function DELETE(req: Request, { params }: { params: { id: string; commentId: string } }) {
  const commentId = Number(params.commentId);
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || !user.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const comment = await prisma.communityComment.findUnique({ where: { id: commentId } });
  if (!comment) {
    return NextResponse.json({ error: "존재하지 않는 댓글입니다." }, { status: 404 });
  }
  if (comment.userId !== Number(user.id)) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }
  await prisma.communityComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
} 