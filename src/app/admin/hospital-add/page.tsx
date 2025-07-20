"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function validateField(name: string, value: string) {
  switch (name) {
    case "name":
      if (!value || value.length < 2 || value.length > 50) return "이름은 2~50자여야 합니다.";
      break;
    case "address":
      if (!value || value.length < 2 || value.length > 100) return "주소는 2~100자여야 합니다.";
      break;
    case "phone":
      if (value && value.length > 20) return "전화번호는 20자 이하여야 합니다.";
      break;
    case "openHours":
      if (value && value.length > 50) return "운영 시간은 50자 이하여야 합니다.";
      break;
    case "specialties":
      if (value && value.length > 100) return "전문 분야는 100자 이하여야 합니다.";
      break;
    case "vets":
      if (value && value.length > 100) return "수의사 정보는 100자 이하여야 합니다.";
      break;
    case "image":
      if (value && value.length > 200) return "이미지 URL은 200자 이하여야 합니다.";
      break;
  }
  return undefined;
}

export default function HospitalAddPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    openHours: "",
    specialties: "",
    vets: "",
    image: "",
    ownerId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<Partial<typeof form>>({});
  const [admins, setAdmins] = useState<{ id: number; name: string; email: string }[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setAdmins((data.users || []).filter((u: { id: number; name: string; email: string; role: string }) => u.role === "hospitalAdmin"));
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldError({ ...fieldError, [e.target.name]: validateField(e.target.name, e.target.value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errors = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, validateField(k, v)])
    );
    setFieldError(errors);
    if (Object.values(errors).some(Boolean)) return;
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch("/api/hospitals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/hospital");
    } else {
      const data = await res.json();
      setError(data.error || "등록에 실패했습니다.");
    }
  };

  return (
    <main className="min-h-screen bg-[#F7FAFC] flex flex-col items-center p-8">
      <div className="w-full max-w-xl bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-[#36A2EB] mb-6">병원 추가</h1>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <input name="name" placeholder="이름*" value={form.name} onChange={handleChange} className="input" required />
          {fieldError.name && <div className="text-red-500 text-xs">{fieldError.name}</div>}
          <input name="address" placeholder="주소*" value={form.address} onChange={handleChange} className="input" required />
          {fieldError.address && <div className="text-red-500 text-xs">{fieldError.address}</div>}
          <input name="phone" placeholder="전화번호" value={form.phone} onChange={handleChange} className="input" />
          {fieldError.phone && <div className="text-red-500 text-xs">{fieldError.phone}</div>}
          <input name="openHours" placeholder="운영 시간" value={form.openHours} onChange={handleChange} className="input" />
          {fieldError.openHours && <div className="text-red-500 text-xs">{fieldError.openHours}</div>}
          <input name="specialties" placeholder="전문 분야(콤마로 구분)" value={form.specialties} onChange={handleChange} className="input" />
          {fieldError.specialties && <div className="text-red-500 text-xs">{fieldError.specialties}</div>}
          <input name="vets" placeholder="수의사 정보(콤마로 구분)" value={form.vets} onChange={handleChange} className="input" />
          {fieldError.vets && <div className="text-red-500 text-xs">{fieldError.vets}</div>}
          <input name="image" placeholder="이미지 URL" value={form.image} onChange={handleChange} className="input" />
          {fieldError.image && <div className="text-red-500 text-xs">{fieldError.image}</div>}
          <select name="ownerId" value={form.ownerId} onChange={handleChange} className="input" required aria-label="병원 관리자 선택">
            <option value="">병원 관리자(업체) 선택*</option>
            {admins.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
            ))}
          </select>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" className="px-6 py-3 rounded bg-[#36A2EB] text-white font-semibold hover:brightness-110 transition" disabled={loading}>
            {loading ? "등록 중..." : "병원 등록"}
          </button>
        </form>
      </div>
    </main>
  );
}

// Tailwind input 스타일을 위한 글로벌 스타일이 필요합니다. 