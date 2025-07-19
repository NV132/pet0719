"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Specialty { id: number; name: string; }
interface Veterinarian { id: number; name: string; license?: string; profileImage?: string; }
interface Hospital {
  id: number;
  name: string;
  address: string;
  phone?: string;
  openHours?: string;
  imageUrls?: string[];
  specialties?: Specialty[];
  veterinarians?: Veterinarian[];
  faq?: string[][];
}

export default function AdminHospitalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [hospital, setHospital] = useState<Hospital|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<any>({});
  const [admins, setAdmins] = useState<{ id: number; name: string; email: string }[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/hospitals/${id}`)
      .then(res => res.json())
      .then(data => {
        setHospital(data.hospital);
        setForm({
          name: data.hospital.name,
          address: data.hospital.address,
          phone: data.hospital.phone || "",
          openHours: data.hospital.openHours || "",
          imageUrls: (data.hospital.imageUrls || []).join(","),
          specialties: (data.hospital.specialties || []).map((s: Specialty) => s.name).join(","),
          veterinarians: (data.hospital.veterinarians || []).map((v: Veterinarian) => v.name).join(","),
          faq: (data.hospital.faq || []).map((qa: string[]) => qa.join(",")).join("/")
        });
        setLoading(false);
      })
      .catch(() => { setError("병원 정보를 불러오지 못했습니다."); setLoading(false); });
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setAdmins((data.users || []).filter((u: any) => u.role === "hospitalAdmin"));
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/hospitals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setEdit(false);
      fetch(`/api/hospitals/${id}`).then(res => res.json()).then(data => setHospital(data.hospital));
    } else {
      setError("수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
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
      router.push("/admin/hospital");
    } else {
      setError("삭제에 실패했습니다.");
    }
  };

  if (loading && !hospital) return <div className="p-8 text-gray-400">불러오는 중...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!hospital) return <div className="p-8 text-gray-400">병원 정보를 찾을 수 없습니다.</div>;

  return (
    <main className="min-h-screen bg-[#F7FAFC] flex flex-col items-center p-8">
      <div className="w-full max-w-xl bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-[#36A2EB] mb-6">병원 상세/수정</h1>
        {!edit ? (
          <>
            <div className="mb-2 font-bold text-lg text-[#36A2EB]">{hospital.name}</div>
            <div className="mb-2 text-gray-700">주소: {hospital.address}</div>
            <div className="mb-2 text-gray-700">전화: {hospital.phone || '-'}</div>
            <div className="mb-2 text-gray-700">운영 시간: {hospital.openHours || '-'}</div>
            <div className="mb-2 text-gray-700">진료과목: {hospital.specialties?.map(s => s.name).join(", ") || '-'}</div>
            <div className="mb-2 text-gray-700">수의사: {hospital.veterinarians?.map(v => v.name).join(", ") || '-'}</div>
            <div className="mb-2 text-gray-700">이미지: {hospital.imageUrls?.join(", ") || '-'}</div>
            <div className="mb-2 text-gray-700">FAQ: {hospital.faq?.map(qa => qa.join(",")).join(" / ") || '-'}</div>
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 rounded bg-[#E3F2FD] text-[#36A2EB] font-semibold" onClick={() => setEdit(true)}>수정</button>
              <button className="px-4 py-2 rounded bg-[#FFCDD2] text-[#D32F2F] font-semibold" onClick={handleDelete}>삭제</button>
              <button className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold" onClick={() => router.push("/admin/hospital")}>목록</button>
            </div>
          </>
        ) : (
          <form className="grid gap-4" onSubmit={handleSave}>
            <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="이름*" required />
            <input name="address" value={form.address} onChange={handleChange} className="input" placeholder="주소*" required />
            <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="전화번호" />
            <input name="openHours" value={form.openHours} onChange={handleChange} className="input" placeholder="운영 시간" />
            <input name="imageUrls" value={form.imageUrls} onChange={handleChange} className="input" placeholder="이미지 URL(콤마로 구분)" />
            <input name="specialties" value={form.specialties} onChange={handleChange} className="input" placeholder="진료과목(콤마로 구분)" />
            <input name="veterinarians" value={form.veterinarians} onChange={handleChange} className="input" placeholder="수의사(콤마로 구분)" />
            <input name="faq" value={form.faq} onChange={handleChange} className="input" placeholder="FAQ(질문,답/질문,답 ...)" />
            <select name="ownerId" value={form.ownerId || ""} onChange={e => setForm({ ...form, ownerId: e.target.value })} className="input" required aria-label="병원 관리자 선택">
              <option value="">병원 관리자(업체) 선택*</option>
              {admins.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
              ))}
            </select>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 rounded bg-[#36A2EB] text-white font-semibold" disabled={loading}>{loading ? "저장 중..." : "저장"}</button>
              <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold" onClick={() => setEdit(false)}>취소</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
} 