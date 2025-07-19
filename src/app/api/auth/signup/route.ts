import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function isEmail(email: string) {
  return /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email);
}

export async function POST(req: Request) {
  const { email, password, name } = await req.json();
  if (!email || !password || !name) {
    return NextResponse.json({ error: "모든 필수값을 입력하세요." }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "이메일 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 32) {
    return NextResponse.json({ error: "비밀번호는 8~32자여야 합니다." }, { status: 400 });
  }
  if (name.length < 2 || name.length > 20) {
    return NextResponse.json({ error: "이름은 2~20자여야 합니다." }, { status: 400 });
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hash, name },
  });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
} 