"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminTabNav from "@/components/AdminTabNav";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}
interface AuditLog {
  id: number;
  user?: { id: number; name: string; email: string };
  action: string;
  targetId?: number;
  targetType?: string;
  detail?: string;
  createdAt: string;
}

const ROLES = ["user", "hospitalAdmin", "admin"];
const STATUS = ["정상", "정지", "탈퇴"];

function downloadCSV(rows: any[], columns: string[], filename: string) {
  const csv = [columns.join(",")].concat(
    rows.map(row => columns.map(col => `"${(row[col] ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminUserManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patching, setPatching] = useState(false);
  // 검색/필터 상태 (초기값: 쿼리에서 읽기)
  const [filter, setFilter] = useState({
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    role: searchParams.get("role") || "",
    status: searchParams.get("status") || "",
    joinedFrom: searchParams.get("joinedFrom") || "",
    joinedTo: searchParams.get("joinedTo") || "",
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalTab, setModalTab] = useState("info");
  // 계정 정지/탈퇴용 비밀번호 입력 모달 상태
  const [pwModal, setPwModal] = useState<{ type: "정지" | "탈퇴" | null, user: User | null }>({ type: null, user: null });
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");

  // 인증 체크 및 데이터 fetch
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    setLoading(true);
    Promise.all([
      fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch("/api/admin/audit-logs", { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
    ]).then(([u, l]) => {
      setUsers(u.users || []);
      setLogs(l.logs || []);
      setLoading(false);
    }).catch(() => { setError("데이터를 불러오지 못했습니다."); setLoading(false); });
  }, [router]);

  // 필터 변경 시 URL 쿼리 동기화
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.name) params.set("name", filter.name);
    if (filter.email) params.set("email", filter.email);
    if (filter.role) params.set("role", filter.role);
    // status, joinedFrom, joinedTo는 추후 구현
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line
  }, [filter.name, filter.email, filter.role]);

  // 권한 변경
  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!window.confirm("정말 권한을 변경하시겠습니까?")) return;
    setPatching(true);
    setError("");
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, newRole }),
    });
    setPatching(false);
    if (res.ok) {
      // 변경 후 목록/로그 새로고침
      const [u, l] = await Promise.all([
        fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
        fetch("/api/admin/audit-logs", { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      ]);
      setUsers(u.users || []);
      setLogs(l.logs || []);
    } else {
      const data = await res.json();
      setError(data.error || "권한 변경에 실패했습니다.");
    }
  };

  // 임시: 모든 회원은 정상 상태로 가정, 실제로는 u.status 사용
  // 상태 변경 핸들러 (API 연동은 추후 구현)
  const handleStatusChange = (userId: number, newStatus: string) => {
    alert(`(예시) ${userId}번 회원 상태를 '${newStatus}'로 변경`);
    // 실제로는 PATCH API 호출 필요
  };

  // 필터 적용된 유저 목록
  const filteredUsers = users.filter(u => {
    if (filter.name && !u.name.includes(filter.name)) return false;
    if (filter.email && !u.email.includes(filter.email)) return false;
    if (filter.role && u.role !== filter.role) return false;
    // status, joinedFrom, joinedTo는 추후 구현
    return true;
  });

  // 계정 정지/탈퇴 처리 (비밀번호 검증 mock)
  const handleAccountAction = (type: "정지" | "탈퇴", user: User) => {
    if (!window.confirm(`정말 ${type} 처리하시겠습니까?`)) return;
    setPwModal({ type, user });
    setPwInput("");
    setPwError("");
  };
  const handlePwSubmit = () => {
    // 실제로는 API로 관리자 비밀번호 검증 필요
    if (pwInput !== "adminpw") { // 예시: 실제로는 세션/실제 비밀번호 사용
      setPwError("비밀번호가 올바르지 않습니다.");
      return;
    }
    alert(`${pwModal.user?.name} 계정 ${pwModal.type} 처리 완료! (API 연동 필요)`);
    setPwModal({ type: null, user: null });
    setSelectedUser(null);
  };

  // 엑셀 내보내기 핸들러
  const handleExport = () => {
    const columns = ["id", "name", "email", "role", "status", "createdAt"];
    const rows = filteredUsers.map(u => ({
      ...u,
      status: "정상", // 실제로는 u.status 사용
      createdAt: new Date(u.createdAt).toLocaleDateString(),
    }));
    downloadCSV(rows, columns, "회원목록.csv");
  };

  return (
    <main className="min-h-screen bg-[#F7FAFC] flex flex-col items-center p-8">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow p-8 mb-8">
        <AdminTabNav />
        <h1 className="text-2xl font-bold text-[#36A2EB] mb-6">유저 관리</h1>
        {/* 검색/필터 바 */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <input
            type="text"
            placeholder="이름 검색"
            className="input px-3 py-2 border rounded"
            value={filter.name}
            onChange={e => setFilter(f => ({ ...f, name: e.target.value }))}
          />
          <input
            type="text"
            placeholder="이메일 검색"
            className="input px-3 py-2 border rounded"
            value={filter.email}
            onChange={e => setFilter(f => ({ ...f, email: e.target.value }))}
          />
          <select
            className="input px-3 py-2 border rounded"
            value={filter.role}
            onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}
            aria-label="권한 필터"
          >
            <option value="">권한 전체</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {/* 상태, 가입일 등은 추후 구현 */}
        </div>
        <div className="flex justify-end mb-2">
          <button className="px-4 py-2 rounded bg-[#36A2EB] text-white font-semibold hover:brightness-110 transition" onClick={handleExport}>
            엑셀로 내보내기
          </button>
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        {/* PC/태블릿: 테이블 */}
        <div className="hidden md:block overflow-x-auto">
          {loading ? <div className="text-gray-400">불러오는 중...</div> : (
            <table className="min-w-full text-sm border mb-8">
              <thead>
                <tr className="bg-[#F7FAFC]">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">이름</th>
                  <th className="p-2 border">이메일</th>
                  <th className="p-2 border">권한</th>
                  <th className="p-2 border">상태</th>
                  <th className="p-2 border">가입일</th>
                  <th className="p-2 border">변경</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const status: string = "정상";
                  let rowClass = "";
                  if (status === "정지") rowClass = "bg-red-50";
                  if (status === "탈퇴") rowClass = "bg-gray-100 text-gray-400";
                  return (
                    <tr key={u.id} className={`hover:bg-[#E3F2FD] ${rowClass}`}>
                      <td className="p-2 border">{u.id}</td>
                      <td className="p-2 border">
                        <button className="text-[#36A2EB] underline hover:font-bold" onClick={() => { setSelectedUser(u); setModalTab("info"); }}>
                          {u.name}
                        </button>
                      </td>
                      <td className="p-2 border">{u.email}</td>
                      <td className="p-2 border">{u.role}</td>
                      <td className="p-2 border">
                        <select
                          value={status}
                          onChange={e => handleStatusChange(u.id, e.target.value)}
                          className="input px-2 py-1 rounded border"
                          aria-label="상태 변경"
                        >
                          {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-2 border">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-2 border">
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          disabled={patching || u.role === "admin"}
                          className="input"
                          aria-label="권한 변경"
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {/* 모바일: 카드형 리스트 */}
        <div className="block md:hidden">
          {loading ? <div className="text-gray-400">불러오는 중...</div> : (
            filteredUsers.map(u => {
              const status: string = "정상";
              let cardClass = "bg-white";
              let statusIcon = "✅";
              let textClass = "text-gray-800";
              if (status === "정지") { cardClass = "bg-red-50"; statusIcon = "🚫"; }
              if (status === "탈퇴") { cardClass = "bg-gray-100"; statusIcon = "❌"; textClass = "text-gray-400"; }
              return (
                <div key={u.id} className={`mb-4 p-4 rounded shadow ${cardClass} ${textClass}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg text-[#36A2EB]">{u.name}</span>
                    <span className="text-xs ml-2">ID: {u.id}</span>
                  </div>
                  <div className="mb-1"><b>이메일:</b> <span className={textClass}>{u.email}</span></div>
                  <div className="mb-1"><b>권한:</b> <span className={textClass}>{u.role}</span></div>
                  <div className="mb-1 flex items-center"><b>상태:</b> <span className={`ml-1 ${textClass}`}>{statusIcon} {status}</span></div>
                  <div className="mb-1"><b>가입일:</b> <span className={textClass}>{new Date(u.createdAt).toLocaleDateString()}</span></div>
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold" onClick={() => { setSelectedUser(u); setModalTab("info"); }}>상세/수정</button>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={patching || u.role === "admin"}
                      className="input px-2 py-1 rounded border"
                      aria-label="권한 변경"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select
                      value={status}
                      onChange={e => handleStatusChange(u.id, e.target.value)}
                      className="input px-2 py-1 rounded border"
                      aria-label="상태 변경"
                    >
                      {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* 회원 상세/수정 모달 */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setSelectedUser(null)}>
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-700" onClick={() => setSelectedUser(null)} aria-label="닫기">×</button>
              <h2 className="text-xl font-bold mb-4 text-[#36A2EB]">회원 상세</h2>
              <div className="flex gap-2 mb-4 border-b pb-2">
                <button className={`px-3 py-1 rounded ${modalTab === "info" ? "bg-blue-100 text-blue-700 font-bold" : "text-gray-600"}`} onClick={() => setModalTab("info")}>기본정보</button>
                <button className={`px-3 py-1 rounded ${modalTab === "activity" ? "bg-blue-100 text-blue-700 font-bold" : "text-gray-600"}`} onClick={() => setModalTab("activity")}>활동내역</button>
                <button className={`px-3 py-1 rounded ${modalTab === "reservation" ? "bg-blue-100 text-blue-700 font-bold" : "text-gray-600"}`} onClick={() => setModalTab("reservation")}>예약</button>
                <button className={`px-3 py-1 rounded ${modalTab === "review" ? "bg-blue-100 text-blue-700 font-bold" : "text-gray-600"}`} onClick={() => setModalTab("review")}>리뷰/글</button>
              </div>
              {modalTab === "info" && (
                <div className="space-y-2">
                  <div><b>이름:</b> {selectedUser.name}</div>
                  <div><b>이메일:</b> {selectedUser.email}</div>
                  <div><b>권한:</b> {selectedUser.role}</div>
                  <div><b>상태:</b> 정상 {/* 실제로는 selectedUser.status */}</div>
                  <div><b>가입일:</b> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                  <div className="flex gap-2 mt-4">
                    <button className="px-4 py-2 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200" onClick={() => handleAccountAction("정지", selectedUser)}>계정 정지</button>
                    <button className="px-4 py-2 rounded bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200" onClick={() => handleAccountAction("탈퇴", selectedUser)}>탈퇴 처리</button>
                  </div>
                </div>
              )}
              {modalTab === "activity" && (
                <div>최근 활동 내역 (예시/mock)</div>
              )}
              {modalTab === "reservation" && (
                <div>예약 내역 (예시/mock)</div>
              )}
              {modalTab === "review" && (
                <div>리뷰/글 내역 (예시/mock)</div>
              )}
            </div>
          </div>
        )}
        {/* 계정 정지/탈퇴 비밀번호 입력 모달 */}
        {pwModal.type && pwModal.user && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setPwModal({ type: null, user: null })}>
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-xs relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-700" onClick={() => setPwModal({ type: null, user: null })} aria-label="닫기">×</button>
              <h2 className="text-lg font-bold mb-4 text-[#36A2EB]">관리자 비밀번호 확인</h2>
              <div className="mb-2">{pwModal.user.name} 계정 <b>{pwModal.type}</b> 처리하려면<br/>관리자 비밀번호를 입력하세요.</div>
              <input
                type="password"
                className="input w-full px-3 py-2 border rounded mb-2"
                placeholder="비밀번호"
                value={pwInput}
                onChange={e => { setPwInput(e.target.value); setPwError(""); }}
                autoFocus
              />
              {pwError && <div className="text-red-500 text-sm mb-2">{pwError}</div>}
              <button className="w-full py-2 rounded bg-[#36A2EB] text-white font-semibold hover:brightness-110 transition" onClick={handlePwSubmit}>확인</button>
            </div>
          </div>
        )}
        <h2 className="text-xl font-bold text-[#4BC0C0] mb-4">감사 로그</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead>
              <tr className="bg-[#F7FAFC]">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">액션</th>
                <th className="p-2 border">대상</th>
                <th className="p-2 border">상세</th>
                <th className="p-2 border">변경자</th>
                <th className="p-2 border">일시</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-[#E0F7FA]">
                  <td className="p-2 border">{l.id}</td>
                  <td className="p-2 border">{l.action}</td>
                  <td className="p-2 border">{l.targetType} #{l.targetId}</td>
                  <td className="p-2 border">{l.detail}</td>
                  <td className="p-2 border">{l.user ? `${l.user.name}(${l.user.email})` : "-"}</td>
                  <td className="p-2 border">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
} 