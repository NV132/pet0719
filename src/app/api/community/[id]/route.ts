import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const postId = Number(context.params.id);
  if (!postId) {
    return NextResponse.json({ error: "게시글 ID가 필요합니다." }, { status: 400 });
  }
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!post) {
    return NextResponse.json({ error: "존재하지 않는 게시글입니다." }, { status: 404 });
  }
  return NextResponse.json({ post });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const postId = Number(params.id);
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || !user.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "존재하지 않는 게시글입니다." }, { status: 404 });
  }
  if (post.userId !== Number(user.id)) {
    return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
  }
  const { title, content, category } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: "제목과 내용은 필수입니다." }, { status: 400 });
  }
  const updated = await prisma.communityPost.update({
    where: { id: postId },
    data: { title, content, category },
  });
  return NextResponse.json({ post: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const postId = Number(params.id);
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || !user.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "존재하지 않는 게시글입니다." }, { status: 404 });
  }
  if (post.userId !== Number(user.id)) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }
  await prisma.communityPost.delete({ where: { id: postId } });
  return NextResponse.json({ ok: true });
} 