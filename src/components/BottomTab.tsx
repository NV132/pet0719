"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/hospital", label: "병원", icon: "🏥" },
  { href: "/community", label: "커뮤니티", icon: "💬" },
  { href: "/shop", label: "이커머스", icon: "🛒" },
  { href: "/mypage", label: "마이페이지", icon: "👤" },
];

export default function BottomTab() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center py-2 z-40 md:hidden">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex flex-col items-center text-xs font-semibold transition ${pathname === tab.href ? "text-[#36A2EB]" : "text-gray-500"}`}
        >
          <span className="text-xl mb-1">{tab.icon}</span>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
} 