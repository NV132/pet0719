"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/user-management", label: "회원관리" },
  { href: "/admin/hospital", label: "병원관리" },
  { href: "/admin/reservation", label: "예약관리" },
  { href: "/admin/report", label: "상담관리" },
  { href: "/admin/community", label: "커뮤니티/리뷰/댓글관리" },
  { href: "/admin/ecommerce", label: "이커머스" },
  { href: "/admin/system", label: "운영/시스템관리" },
  { href: "/admin/support", label: "고객센터/문의관리" },
  { href: "/admin/statistics", label: "마케팅/통계" },
  { href: "/admin/notification", label: "알림/메시지관리" },
  { href: "/admin/role", label: "권한/역할관리" },
  { href: "/admin/extra", label: "기타/확장성" },
];

export default function AdminTabNav() {
  const pathname = usePathname();
  return (
    <nav className="w-full flex gap-2 md:gap-6 px-2 md:px-8 py-2 bg-transparent border-b border-gray-100 mb-6 overflow-x-auto">
      {tabs.map(tab => {
        const active = pathname === tab.href || (tab.href === "/admin" && pathname === "/admin/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition text-base md:text-lg ${active ? "bg-purple-100 text-purple-700" : "text-gray-700 hover:bg-gray-100"}`}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
} 