"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Report {
  id: number;
  postId?: number;
  commentId?: number;
  post?: { id: number; title: string };
  comment?: { id: number; content: string };
  user?: { id: number; name: string };
  reason: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS = ["pending", "resolved", "rejected"];

export default function AdminReportPage() {
  const router = useRouter();
  interface Report {
    id: number;
    type: string;
    targetId: number;
    reason: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    user: { id: number; name: string };
    postId?: number;
    post?: { id: number; title: string };
    comment?: { id: number; content: string };
  }
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const [patching, setPatching] = useState(false);
  const [error, setError] = useState("");

  // 관리자 인증(없으면 로그인 이동)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) router.replace("/login");
    }
  }, [router]);

  // 신고 목록 fetch
  const fetchReports = () => {
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (type) params.append("type", type);
    if (keyword) params.append("keyword", keyword);
    fetch(`/api/community/report?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then((data: { reports: Report[] }) => { setReports(data.reports || []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { fetchReports(); }, [status, type]);

  // 상세 fetch
  const fetchDetail = (id: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch(`/api/community/report/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then(data => setSelected(data.report))
      .catch(() => setSelected(null));
  };

  // 상태 변경
  const handleStatus = async (id: number, newStatus: string) => {
    setPatching(true);
    setError("");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`/api/community/report/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ status: newStatus }),
    });
    setPatching(false);
    if (res.ok) { fetchReports(); setSelected(null); }
    else { const data = await res.json(); setError(data.error || "상태 변경 실패"); }
  };

  return (
    <main className="min-h-screen bg-[#F7FAFC] flex flex-col items-center p-8">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-[#36A2EB] mb-6">커뮤니티 신고 관리</h1>
        <div className="flex gap-2 mb-4">
          <select value={status} onChange={e => setStatus(e.target.value)} className="input" aria-label="상태 필터">
            <option value="">전체상태</option>
            {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)} className="input" aria-label="타입 필터">
            <option value="">전체유형</option>
            <option value="post">글</option>
            <option value="comment">댓글</option>
          </select>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} className="input" placeholder="신고 사유 검색" aria-label="신고 사유 검색" />
          <button className="px-4 py-2 rounded bg-[#36A2EB] text-white font-semibold" onClick={fetchReports}>검색</button>
        </div>
        {loading ? <div className="text-gray-400">불러오는 중...</div> : (
          <table className="w-full text-sm border mt-2">
            <thead>
              <tr className="bg-[#F7FAFC]">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">유형</th>
                <th className="p-2 border">대상</th>
                <th className="p-2 border">신고자</th>
                <th className="p-2 border">사유</th>
                <th className="p-2 border">상태</th>
                <th className="p-2 border">처리</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-[#E3F2FD] cursor-pointer" onClick={() => fetchDetail(r.id)}>
                  <td className="p-2 border">{r.id}</td>
                  <td className="p-2 border">{r.postId ? "글" : "댓글"}</td>
                  <td className="p-2 border">{r.post ? r.post.title : r.comment?.content?.slice(0, 20)}</td>
                  <td className="p-2 border">{r.user?.name}</td>
                  <td className="p-2 border">{r.reason}</td>
                  <td className="p-2 border">{r.status}</td>
                  <td className="p-2 border text-center">
                    {STATUS.filter(s => s !== r.status).map(s => (
                      <button key={s} className="px-2 py-1 rounded bg-[#4BC0C0] text-white text-xs mx-1" disabled={patching} onClick={e => { e.stopPropagation(); handleStatus(r.id, s); }}>{s}</button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* 상세 모달 */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-600">×</button>
              <h2 className="text-xl font-bold mb-4 text-[#36A2EB]">신고 상세</h2>
              <div className="mb-2"><b>ID:</b> {selected.id}</div>
              <div className="mb-2"><b>유형:</b> {selected.postId ? "글" : "댓글"}</div>
              <div className="mb-2"><b>대상:</b> {selected.post ? selected.post.title : selected.comment?.content}</div>
              <div className="mb-2"><b>신고자:</b> {selected.user?.name}</div>
              <div className="mb-2"><b>사유:</b> {selected.reason}</div>
              <div className="mb-2"><b>상태:</b> {selected.status}</div>
              <div className="mb-2"><b>신고일:</b> {new Date(selected.createdAt).toLocaleString()}</div>
              <div className="mb-2"><b>처리일:</b> {typeof selected.updatedAt === 'string' ? new Date(selected.updatedAt).toLocaleString() : '-'}</div>
              <div className="flex gap-2 mt-4">
                {STATUS.filter(s => s !== selected.status).map(s => (
                  <button key={s} className="px-4 py-2 rounded bg-[#4BC0C0] text-white font-semibold" disabled={patching} onClick={() => handleStatus(selected.id, s)}>{s}</button>
                ))}
                <button className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold" onClick={() => setSelected(null)}>닫기</button>
              </div>
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 