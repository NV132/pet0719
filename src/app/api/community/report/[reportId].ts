import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

// GET: 신고 상세(관리자)
export async function GET(req: Request, { params }: { params: { reportId: string } }) {
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근 가능합니다." }, { status: 403 });
  }
  const report = await prisma.communityReport.findUnique({
    where: { id: Number(params.reportId) },
    include: {
      user: { select: { id: true, name: true } },
      post: { select: { id: true, title: true } },
      comment: { select: { id: true, content: true } },
    },
  });
  if (!report) return NextResponse.json({ error: "존재하지 않는 신고입니다." }, { status: 404 });
  return NextResponse.json({ report });
}

// PATCH: 신고 상태 변경(관리자)
export async function PATCH(req: Request, { params }: { params: { reportId: string } }) {
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근 가능합니다." }, { status: 403 });
  }
  const { status } = await req.json();
  if (!status) return NextResponse.json({ error: "상태가 필요합니다." }, { status: 400 });
  const updated = await prisma.communityReport.update({
    where: { id: Number(params.reportId) },
    data: { status },
  });
  return NextResponse.json({ report: updated });
} 