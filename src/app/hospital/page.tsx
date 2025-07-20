"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useTransition, useCallback } from "react";
import { useInView } from "react-intersection-observer";

interface Specialty {
  id: number;
  name: string;
  description?: string;
}
interface Veterinarian {
  id: number;
  name: string;
  license?: string;
  profileImage?: string;
}
interface Hospital {
  id: number;
  name: string;
  address: string;
  imageUrls?: string[];
  specialties?: Specialty[];
  veterinarians?: Veterinarian[];
  faq?: string[][];
}

const PAGE_SIZE = 20;

export default function HospitalListPage() {
  const [q, setQ] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { ref, inView } = useInView();

  const fetchHospitals = useCallback(async (reset = false) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (specialty) params.append("specialty", specialty);
    params.append("page", String(reset ? 1 : page));
    params.append("limit", String(PAGE_SIZE));
    const res = await fetch(`/api/hospitals?${params.toString()}`);
    const data = await res.json();
    setHospitals(prev => reset ? data.hospitals : [...prev, ...data.hospitals]);
    setTotal(data.total);
    setLoading(false);
  }, [q, specialty, page]);

  // 최초 로드 및 검색/필터 변경 시 목록 리셋
  useEffect(() => {
    setPage(1);
    startTransition(() => {
      fetchHospitals(true);
    });
    // eslint-disable-next-line
  }, [q, specialty]);

  // 페이지 변경(무한 스크롤) 시 추가 데이터 로드
  useEffect(() => {
    if (page === 1) return;
    fetchHospitals();
    // eslint-disable-next-line
  }, [page]);

  // inView(하단 감지) 시 다음 페이지 로드
  useEffect(() => {
    if (inView && !loading && hospitals.length < total) {
      setPage(p => p + 1);
    }
    // eslint-disable-next-line
  }, [inView]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    startTransition(() => {
      fetchHospitals(true);
    });
  };

  return (
    <main className="min-h-screen bg-[#F7FAFC] flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold text-[#36A2EB] mb-8">병원 목록</h1>
      <form className="flex flex-wrap gap-2 mb-6 w-full max-w-2xl" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="이름, 주소 검색"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="input flex-1 min-w-0"
        />
        <select
          value={specialty}
          onChange={e => setSpecialty(e.target.value)}
          className="input w-40"
          aria-label="전문 분야 필터"
        >
          <option value="">전문 분야 전체</option>
          <option value="내과">내과</option>
          <option value="외과">외과</option>
          <option value="치과">치과</option>
          <option value="피부과">피부과</option>
          <option value="안과">안과</option>
          <option value="영상의학과">영상의학과</option>
          <option value="재활의학과">재활의학과</option>
        </select>
        <button type="submit" className="px-4 py-2 rounded bg-[#36A2EB] text-white font-semibold hover:brightness-110 transition">검색</button>
      </form>
      <div className="w-full max-w-2xl grid gap-4">
        {(loading || isPending) && hospitals.length === 0 && <div className="text-gray-400 text-center py-8">검색 중...</div>}
        {!loading && hospitals.length === 0 && <div className="text-gray-400 text-center py-8">등록된 병원이 없습니다.</div>}
        {hospitals.map((h, i) => (
          <Link
            key={h.id}
            href={`/hospital/${h.id}`}
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition border border-gray-100 flex gap-4 items-center"
            ref={i === hospitals.length - 1 ? ref : undefined}
          >
            {h.imageUrls && h.imageUrls[0] && (
              <Image src={h.imageUrls[0]} alt={h.name} width={64} height={64} className="w-16 h-16 rounded object-cover border" />
            )}
            <div>
              <div className="text-xl font-semibold text-[#36A2EB]">{h.name}</div>
              <div className="text-gray-500 text-sm mt-1">{h.address}</div>
              {h.specialties && h.specialties.length > 0 && (
                <div className="text-xs text-[#4BC0C0] mt-1">
                  {h.specialties.map(s => s.name).join(", ")}
                </div>
              )}
            </div>
          </Link>
        ))}
        {loading && hospitals.length > 0 && <div className="text-gray-400 text-center py-4">불러오는 중...</div>}
      </div>
    </main>
  );
} 