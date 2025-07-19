import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function isEmail(email: string) {
  return /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email);
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력하세요." }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "이메일 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 32) {
    return NextResponse.json({ error: "비밀번호는 8~32자여야 합니다." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "존재하지 않는 이메일입니다." }, { status: 404 });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 401 });
  }
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
} 