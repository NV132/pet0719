"use client";
import { useState } from "react";
import Link from "next/link";
import AdminTabNav from "@/components/AdminTabNav";

interface StatCard {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
}

export default function AdminDashboard() {
  // 실제 데이터는 API 연동 필요. MVP용 mock 데이터 사용
  const [stats] = useState<StatCard[]>([
    { title: "총 회원수", value: 1, sub: "+0명", icon: <span className="text-2xl">👤</span>, color: "bg-blue-50", href: "/admin/user-management" },
    { title: "등록 병원", value: 2, sub: "승인완료", icon: <span className="text-2xl">🏥</span>, color: "bg-green-50", href: "/admin/hospital" },
    { title: "총 예약", value: 2, sub: "1건 대기", icon: <span className="text-2xl">📅</span>, color: "bg-yellow-50", href: "/admin/hospital" },
    { title: "AI 진단", value: 1847, sub: "오늘 152회", icon: <span className="text-2xl">🤖</span>, color: "bg-purple-50" },
  ]);
  const [recent] = useState([
    { type: "회원가입", user: "박영희", time: "5분 전", icon: "👤" },
    { type: "병원 승인 요청", user: "사랑동물병원", time: "10분 전", icon: "🏥" },
    { type: "새 예약", user: "김철수 → 우리동물병원", time: "15분 전", icon: "📅" },
    { type: "AI 진단 실행", user: "총 152회", time: "1시간 전", icon: "🤖" },
  ]);
  const quick = [
    { title: "회원 관리", desc: "신규 회원 승인", icon: "👤", href: "/admin/user-management" },
    { title: "병원 승인", desc: "병원 등록 승인", icon: "🏥", href: "/admin/hospital" },
    { title: "상담 모니터링", desc: "실시간 상담 관리", icon: "💬", href: "/admin/report" },
    { title: "통계 보고서", desc: "상세 분석 보기", icon: "📊", href: "/admin/dashboard" },
  ];

  return (
    <main className="min-h-screen bg-[#F7FAFC] flex flex-col items-center p-8">
      <div className="w-full max-w-5xl">
        <AdminTabNav />
        {/* 상단 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <Link key={i} href={s.href || "#"} className={`rounded-xl shadow p-6 flex flex-col gap-2 ${s.color} hover:scale-105 transition cursor-pointer`}>
              <div className="flex items-center gap-2">
                {s.icon}
                <span className="text-gray-500 text-sm">{s.title}</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              {s.sub && <div className="text-xs text-gray-400">{s.sub}</div>}
            </Link>
          ))}
        </div>
        {/* 최근 활동 */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#36A2EB]">최근 활동</h2>
            <Link href="#" className="text-sm text-[#36A2EB] hover:underline">전체보기</Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {recent.map((r, i) => (
              <li key={i} className="py-2 flex items-center gap-3">
                <span className="text-xl">{r.icon}</span>
                <span className="font-semibold text-gray-700">{r.type}</span>
                <span className="text-gray-500 text-sm">{r.user}</span>
                <span className="ml-auto text-xs text-gray-400">{r.time}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* 빠른 작업 */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-[#36A2EB] mb-4">빠른 작업</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quick.map((q, i) => (
              <Link key={i} href={q.href} className="rounded-xl border border-gray-100 p-6 flex flex-col items-center gap-2 hover:bg-blue-50 transition cursor-pointer">
                <span className="text-2xl mb-1">{q.icon}</span>
                <span className="font-semibold text-gray-700">{q.title}</span>
                <span className="text-xs text-gray-400">{q.desc}</span>
              </Link>
            ))}
          </div>
        </div>
        {/* 통계/차트 등 추가 섹션은 추후 구현 */}
      </div>
    </main>
  );
} 