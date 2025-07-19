"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Hospital {
  id: number;
  name: string;
  address: string;
  phone?: string;
  openHours?: string;
  imageUrls?: string[];
  specialties?: { id: number; name: string }[];
}

export default function AdminHospitalPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHospitals = async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (specialty) params.append("specialty", specialty);
    params.append("limit", "100");
    try {
      const res = await fetch(`/api/hospitals?${params.toString()}`);
      const data = await res.json();
      setHospitals(data.hospitals || []);
    } catch {
      setError("병원 목록을 불러오지 못했습니다.");
    }
    setLoading(false);
  };

  useEffect(() => { fetchHospitals(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHospitals();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/hospitals/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setLoading(false);
    if (res.ok) {
      setHospitals(prev => prev.filter(h => h.id !== id));
    } else {
      setError("삭제에 실패했습니다.");
    }
  };

  return (
    <main className="min-h-screen bg-[#F7FAFC] flex flex-col items-center p-8">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-[#36A2EB] mb-6">관리자 병원 관리</h1>
        <form className="flex flex-wrap gap-2 mb-6" onSubmit={handleSearch}>
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
          <button type="button" className="px-4 py-2 rounded bg-[#4BC0C0] text-white font-semibold hover:brightness-110 transition" onClick={() => router.push("/admin/hospital-add")}>병원 추가</button>
        </form>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        {loading && <div className="text-gray-400">불러오는 중...</div>}
        <ul className="divide-y divide-gray-100">
          {hospitals.map(h => (
            <li key={h.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <div className="font-bold text-[#36A2EB] text-lg">{h.name}</div>
                <div className="text-gray-500 text-sm">{h.address}</div>
                {h.specialties && h.specialties.length > 0 && (
                  <div className="text-xs text-[#4BC0C0] mt-1">{h.specialties.map(s => s.name).join(", ")}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded bg-[#E3F2FD] text-[#36A2EB] text-xs font-semibold hover:brightness-110 transition" onClick={() => router.push(`/admin/hospital/${h.id}`)}>상세/수정</button>
                <button className="px-3 py-1 rounded bg-[#FFCDD2] text-[#D32F2F] text-xs font-semibold hover:brightness-110 transition" onClick={() => handleDelete(h.id)}>삭제</button>
              </div>
            </li>
          ))}
        </ul>
        {!loading && hospitals.length === 0 && <div className="text-gray-400 text-center py-8">등록된 병원이 없습니다.</div>}
      </div>
    </main>
  );
} 