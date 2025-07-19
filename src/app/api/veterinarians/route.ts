import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
 
export async function GET() {
  const veterinarians = await prisma.veterinarian.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ veterinarians });
} 