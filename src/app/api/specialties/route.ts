import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
 
export async function GET() {
  const specialties = await prisma.specialty.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ specialties });
} 