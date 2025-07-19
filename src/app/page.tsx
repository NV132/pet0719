import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center p-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-[#36A2EB] mb-2">펫 플랫폼</h1>
        <p className="text-lg text-gray-700">반려동물과 병원을 연결하는 현대적 펫코노미 서비스</p>
      </header>
      <nav className="flex flex-wrap gap-6 mb-16 justify-center">
        <Link href="/hospital" className="px-6 py-3 rounded-lg bg-[#36A2EB] text-white font-semibold shadow hover:brightness-110 transition">병원 목록</Link>
        <Link href="/mypage" className="px-6 py-3 rounded-lg bg-[#4BC0C0] text-white font-semibold shadow hover:brightness-110 transition">마이페이지</Link>
        <Link href="/admin" className="px-6 py-3 rounded-lg bg-[#FFCE56] text-gray-900 font-semibold shadow hover:brightness-110 transition">관리자 대시보드</Link>
      </nav>
      <section className="max-w-2xl w-full bg-white rounded-xl shadow p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-[#36A2EB]">주요 기능</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>4,000+ 병원 무한 스크롤, 검색/필터</li>
          <li>실시간 채팅, 예약, 리뷰, Q&A</li>
          <li>이커머스(사료/용품), 커뮤니티</li>
          <li>관리자/병원업체 대시보드</li>
        </ul>
      </section>
      <footer className="text-gray-400 text-sm mt-8">© 2024 펫 플랫폼. All rights reserved.</footer>
      </main>
  );
}
