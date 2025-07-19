import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const address = searchParams.get("address") || undefined;
  const specialty = searchParams.get("specialty") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;
  const mine = searchParams.get("mine");

  // where 조건 생성
  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
    ];
  }
  if (address) {
    where.address = { contains: address, mode: "insensitive" };
  }
  // specialty(진료과목) 필터: 조인 테이블 활용
  if (specialty) {
    where.specialties = {
      some: {
        specialty: {
          name: { contains: specialty, mode: "insensitive" },
        },
      },
    };
  }
  // 본인(ownerId) 병원만 반환 (mine=1)
  if (mine === "1") {
    const auth = req.headers.get("authorization");
    const user = verifyToken(auth || undefined) as JwtPayload | null;
    if (!user || user.role !== "hospitalAdmin") {
      return NextResponse.json({ error: "병원업체 권한이 필요합니다." }, { status: 403 });
    }
    where.ownerId = Number(user.id);
  }

  const [hospitals, total] = await Promise.all([
    prisma.hospital.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: limit,
      include: {
        specialties: {
          include: { specialty: true },
        },
        veterinarians: {
          include: { veterinarian: true },
        },
      },
    }),
    prisma.hospital.count({ where }),
  ]);

  // 응답 데이터 가공: specialties, veterinarians, imageUrls, faq 파싱
  const result = hospitals.map((h: any) => ({
    ...h,
    specialties: (h.specialties as any[]).map((s: any) => s.specialty),
    veterinarians: (h.veterinarians as any[]).map((v: any) => v.veterinarian),
    imageUrls: h.imageUrls ? (h.imageUrls as string).split(",") : [],
    faq: h.faq ? (h.faq as string).split("/").map((f: string) => f.split(",")) : [], // [[Q,A], ...]
  }));

  return NextResponse.json({ hospitals: result, total });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const user = verifyToken(auth || undefined) as JwtPayload | null;
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  const data = await req.json();
  // 입력값 검증
  if (!data.name || typeof data.name !== "string" || data.name.length < 2 || data.name.length > 50) {
    return NextResponse.json({ error: "이름은 2~50자여야 합니다." }, { status: 400 });
  }
  if (!data.address || typeof data.address !== "string" || data.address.length < 2 || data.address.length > 100) {
    return NextResponse.json({ error: "주소는 2~100자여야 합니다." }, { status: 400 });
  }
  if (data.phone && data.phone.length > 20) {
    return NextResponse.json({ error: "전화번호는 20자 이하여야 합니다." }, { status: 400 });
  }
  if (data.openHours && data.openHours.length > 50) {
    return NextResponse.json({ error: "운영 시간은 50자 이하여야 합니다." }, { status: 400 });
  }
  // specialties, veterinarians는 배열로 받음
  if (!Array.isArray(data.specialties) || data.specialties.length === 0) {
    return NextResponse.json({ error: "진료과목을 1개 이상 선택하세요." }, { status: 400 });
  }
  if (!Array.isArray(data.veterinarians) || data.veterinarians.length === 0) {
    return NextResponse.json({ error: "수의사를 1명 이상 선택하세요." }, { status: 400 });
  }
  // 진료과목 연결/생성
  const specialtyConnect = await Promise.all(
    data.specialties.map(async (name: string) => {
      let s = await prisma.specialty.findUnique({ where: { name } });
      if (!s) s = await prisma.specialty.create({ data: { name } });
      return { specialtyId: s.id };
    })
  );
  // 수의사 연결/생성
  const vetConnect = await Promise.all(
    data.veterinarians.map(async (name: string) => {
      let v = await prisma.veterinarian.findUnique({ where: { name } });
      if (!v) v = await prisma.veterinarian.create({ data: { name } });
      return { veterinarianId: v.id };
    })
  );
  // 이미지, FAQ 등
  const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls.join(",") : (data.imageUrls || "");
  const faq = Array.isArray(data.faq) ? data.faq.map((qa: string[]) => qa.join(",")).join("/") : (data.faq || "");
  const hospital = await prisma.hospital.create({
    data: {
      name: data.name,
      address: data.address,
      phone: data.phone,
      openHours: data.openHours,
      imageUrls,
      faq,
      specialties: { create: specialtyConnect },
      veterinarians: { create: vetConnect },
      ...(data.ownerId ? { ownerId: Number(data.ownerId) } : {}),
    },
    include: {
      specialties: { include: { specialty: true } },
      veterinarians: { include: { veterinarian: true } },
    },
  });
  return NextResponse.json({ hospital });
} 