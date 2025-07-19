import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const hospital = await prisma.hospital.findUnique({
    where: { id: Number(params.id) },
    include: {
      specialties: { include: { specialty: true } },
      veterinarians: { include: { veterinarian: true } },
    },
  }) as any;
  if (!hospital) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // 데이터 가공: specialties, veterinarians, imageUrls, faq
  const result = {
    ...hospital,
    specialties: hospital.specialties.map((s: any) => s.specialty),
    veterinarians: hospital.veterinarians.map((v: any) => v.veterinarian),
    imageUrls: hospital.imageUrls ? hospital.imageUrls.split(",") : [],
    faq: hospital.faq ? hospital.faq.split("/").map((f: string) => f.split(",")) : [],
  };
  return NextResponse.json({ hospital: result });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const data = await req.json();
  // 인증 및 권한 체크
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || (user.role !== "admin" && user.role !== "hospitalAdmin")) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const hospital = await prisma.hospital.findUnique({ where: { id } });
  if (!hospital) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role === "hospitalAdmin" && hospital.ownerId !== user.id) {
    return NextResponse.json({ error: "본인 병원만 수정할 수 있습니다." }, { status: 403 });
  }
  // ownerId, name, address 등 전달된 값만 업데이트
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.address) updateData.address = data.address;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.openHours !== undefined) updateData.openHours = data.openHours;
  if (data.imageUrls !== undefined) updateData.imageUrls = data.imageUrls;
  if (data.faq !== undefined) updateData.faq = data.faq;
  if (data.ownerId !== undefined) updateData.ownerId = Number(data.ownerId);
  await prisma.hospital.update({ where: { id }, data: updateData });
  // 상세 정보(조인 포함)로 반환
  const hospitalDetail = await prisma.hospital.findUnique({
    where: { id },
    include: {
      specialties: { include: { specialty: true } },
      veterinarians: { include: { veterinarian: true } },
    },
  });
  if (!hospitalDetail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const result = {
    ...hospitalDetail,
    specialties: hospitalDetail.specialties.map((s: any) => s.specialty),
    veterinarians: hospitalDetail.veterinarians.map((v: any) => v.veterinarian),
    imageUrls: hospitalDetail.imageUrls ? hospitalDetail.imageUrls.split(",") : [],
    faq: hospitalDetail.faq ? hospitalDetail.faq.split("/").map((f: string) => f.split(",")) : [],
  };
  return NextResponse.json({ hospital: result });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  // 인증 및 권한 체크
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || (user.role !== "admin" && user.role !== "hospitalAdmin")) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const hospital = await prisma.hospital.findUnique({ where: { id } });
  if (!hospital) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role === "hospitalAdmin" && hospital.ownerId !== user.id) {
    return NextResponse.json({ error: "본인 병원만 삭제할 수 있습니다." }, { status: 403 });
  }
  await prisma.hospital.delete({ where: { id } });
  return NextResponse.json({ ok: true });
} 