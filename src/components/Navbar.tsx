"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = parseJwt(token);
        if (payload && payload.name) {
          setUser({ name: payload.name, role: payload.role });
        }
      } else {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <>
      <nav className="w-full bg-white shadow flex items-center justify-between px-6 py-3 fixed top-0 left-0 z-30">
        <Link href="/" className="text-2xl font-bold text-[#36A2EB]">펫플랫폼</Link>
        <div className="hidden md:flex gap-6 items-center">
          <Link href="/hospital" className="text-gray-700 hover:text-[#36A2EB] font-semibold transition">병원</Link>
          <Link href="/mypage" className="text-gray-700 hover:text-[#4BC0C0] font-semibold transition">마이페이지</Link>
          <Link href="/admin" className="text-gray-700 hover:text-[#FFCE56] font-semibold transition">관리자</Link>
          {user?.role === "admin" && (
            <Link href="/admin/user-management" className="text-gray-700 hover:text-[#36A2EB] font-semibold transition">유저관리</Link>
          )}
          {user?.role === "hospitalAdmin" && (
            <Link href="/hospital-admin" className="text-gray-700 hover:text-[#36A2EB] font-semibold transition">병원업체</Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-700 font-semibold">
                {user.name}님{user.role === "admin" && <span className="ml-1 text-xs text-[#FF4D4F]">(시스템관리자)</span>}
              </span>
              <button onClick={handleLogout} className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">로그아웃</button>
            </>
          ) : (
            <Link href="/login" className="text-sm text-[#36A2EB] font-semibold">로그인</Link>
          )}
        </div>
        {/* 모바일 햄버거 메뉴 */}
        <button className="md:hidden text-2xl text-[#36A2EB]" onClick={() => setMobileMenuOpen(true)}>☰</button>
      </nav>
      {/* 모바일 메뉴 오버레이 */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 bg-white h-full shadow-lg p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <button className="self-end text-2xl mb-4 text-gray-400 hover:text-gray-700" onClick={() => setMobileMenuOpen(false)} aria-label="메뉴 닫기">×</button>
            <Link href="/hospital" className="py-2 text-gray-700 font-semibold border-b" onClick={() => setMobileMenuOpen(false)}>병원</Link>
            <Link href="/mypage" className="py-2 text-gray-700 font-semibold border-b" onClick={() => setMobileMenuOpen(false)}>마이페이지</Link>
            <Link href="/admin" className="py-2 text-gray-700 font-semibold border-b" onClick={() => setMobileMenuOpen(false)}>관리자</Link>
            {user?.role === "admin" && (
              <Link href="/admin/user-management" className="py-2 text-gray-700 font-semibold border-b" onClick={() => setMobileMenuOpen(false)}>유저관리</Link>
            )}
            {user?.role === "hospitalAdmin" && (
              <Link href="/hospital-admin" className="py-2 text-gray-700 font-semibold border-b" onClick={() => setMobileMenuOpen(false)}>병원업체</Link>
            )}
            <div className="mt-6">
              {user ? (
                <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="w-full py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold">로그아웃</button>
              ) : (
                <Link href="/login" className="w-full block py-2 rounded bg-[#36A2EB] text-white text-center font-semibold" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 