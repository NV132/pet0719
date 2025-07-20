import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  const posts = await prisma.communityPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
    skip: offset,
    take: limit,
  });
  const total = await prisma.communityPost.count({ where });
  return NextResponse.json({ posts, total });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || !user.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { title, content, category } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: "제목과 내용은 필수입니다." }, { status: 400 });
  }
  const post = await prisma.communityPost.create({
    data: {
      userId: Number(user.id),
      title,
      content,
      category,
    },
  });
  return NextResponse.json({ post });
} 