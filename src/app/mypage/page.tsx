"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Reservation {
  id: number;
  reservedAt: string;
  status: string;
  memo?: string;
  hospital: { id: number; name: string };
}

interface Review {
  id: number;
  rating: number;
  content: string;
  createdAt: string;
  hospital: { id: number; name: string };
}

function ReviewEditModal({ review, onClose, onSave }: { review: Review; onClose: () => void; onSave: (content: string, rating: number) => void }) {
  const [content, setContent] = useState(review.content);
  const [rating, setRating] = useState(review.rating);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-600" aria-label="닫기">×</button>
        <h2 className="text-xl font-bold mb-4 text-[#36A2EB]">리뷰 수정</h2>
        <form className="grid gap-4" onSubmit={async e => {
          e.preventDefault();
          setError("");
          if (!content.trim()) { setError("리뷰 내용을 입력하세요."); return; }
          if (content.length > 300) { setError("리뷰는 300자 이내로 작성해주세요."); return; }
          setLoading(true);
          await onSave(content, rating);
          setLoading(false);
        }}>
          <div className="flex gap-1 items-center" aria-label="별점 선택">
            {[1,2,3,4,5].map(n => (
              <button type="button" key={n} onClick={() => setRating(n)} aria-label={`별점 ${n}점`} className="focus:outline-none">
                <span className={n <= rating ? "text-[#FFCE56] text-2xl" : "text-gray-300 text-2xl"}>★</span>
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">{rating}점</span>
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)} className="input" placeholder="리뷰 내용을 입력하세요. (최대 300자)" rows={4} required aria-label="리뷰 내용" maxLength={300} />
          <div className="text-xs text-gray-400 text-right">{content.length}/300자</div>
          {error && <div className="text-red-500 text-sm" role="alert">{error}</div>}
          <button type="submit" className="px-6 py-3 rounded bg-[#36A2EB] text-white font-semibold hover:brightness-110 transition" disabled={loading} aria-label="리뷰 수정">
            {loading ? "수정 중..." : "리뷰 수정"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MyPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editReview, setEditReview] = useState<Review | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }
      setLoading(true);
      Promise.all([
        fetch("/api/reservations", { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
        fetch("/api/reviews", { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      ])
        .then(([r1, r2]) => {
          setReservations(r1.reservations || []);
          setReviews(r2.reviews || []);
          setLoading(false);
        })
        .catch(() => {
          setError("내역을 불러오지 못했습니다.");
          setLoading(false);
        });
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-[#F7FAFC] flex flex-col items-center p-8">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-[#36A2EB] mb-6">마이페이지</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <section className="bg-[#E3F2FD] rounded-lg p-4">
            <h2 className="font-semibold text-[#36A2EB] mb-2">내 정보</h2>
            <p className="text-gray-700 text-sm">이름, 이메일, 프로필 수정</p>
          </section>
          <section className="bg-[#FFF9E5] rounded-lg p-4">
            <h2 className="font-semibold text-[#FFCE56] mb-2">예약 내역</h2>
            <p className="text-gray-700 text-sm">진행 중/완료된 예약 확인</p>
          </section>
          <section className="bg-[#E0F7FA] rounded-lg p-4">
            <h2 className="font-semibold text-[#4BC0C0] mb-2">리뷰/Q&A</h2>
            <p className="text-gray-700 text-sm">내가 작성한 리뷰, Q&A 관리</p>
          </section>
          <section className="bg-[#F7FAFC] border border-gray-200 rounded-lg p-4">
            <h2 className="font-semibold text-[#36A2EB] mb-2">찜한 병원/상품</h2>
            <p className="text-gray-700 text-sm">즐겨찾기 목록</p>
          </section>
          <section className="bg-[#F7FAFC] border border-gray-200 rounded-lg p-4">
            <h2 className="font-semibold text-[#4BC0C0] mb-2">알림 설정</h2>
            <p className="text-gray-700 text-sm">푸시/이메일 알림 관리</p>
          </section>
        </div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#36A2EB] mb-2">내 예약 내역</h2>
          {loading && <div className="text-gray-400">불러오는 중...</div>}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {!loading && reservations.length === 0 && <div className="text-gray-400">예약 내역이 없습니다.</div>}
          <ul className="divide-y divide-gray-100">
            {reservations.map(r => {
              let statusColor = "bg-[#E3F2FD] text-[#36A2EB]";
              if (r.status === "completed") statusColor = "bg-[#C8E6C9] text-[#388E3C]";
              if (r.status === "cancelled") statusColor = "bg-[#FFCDD2] text-[#D32F2F]";
              return (
                <li key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <button
                    className="font-semibold text-[#36A2EB] hover:underline text-left"
                    onClick={() => router.push(`/hospital/${r.hospital.id}`)}
                    aria-label={`병원 상세로 이동: ${r.hospital.name}`}
                  >
                    {r.hospital.name}
                  </button>
                  <span className="text-gray-700 text-sm">{new Date(r.reservedAt).toLocaleString()}</span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${statusColor}`}>{r.status}</span>
                  {r.memo && <span className="text-gray-400 text-xs">메모: {r.memo}</span>}
                  {r.status === "pending" && (
                    <button
                      className="ml-2 px-2 py-1 rounded bg-[#FFCDD2] text-[#D32F2F] text-xs font-semibold hover:brightness-110 transition"
                      onClick={async () => {
                        if (!window.confirm("예약을 취소하시겠습니까?")) return;
                        setLoading(true);
                        setError("");
                        const token = localStorage.getItem("token");
                        const res = await fetch(`/api/reservations/${r.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ status: "cancelled" }),
                        });
                        setLoading(false);
                        if (res.ok) {
                          setReservations(prev => prev.map(x => x.id === r.id ? { ...x, status: "cancelled" } : x));
                        } else {
                          setError("예약 취소에 실패했습니다.");
                        }
                      }}
                      aria-label="예약 취소"
                    >
                      예약 취소
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#FFCE56] mb-2">내가 작성한 리뷰</h2>
          {loading && <div className="text-gray-400">불러오는 중...</div>}
          {!loading && reviews.length === 0 && <div className="text-gray-400">작성한 리뷰가 없습니다.</div>}
          <ul className="divide-y divide-gray-100">
            {reviews.map(r => (
              <li key={r.id} className="py-3 flex flex-col gap-1 relative">
                <button
                  className="font-semibold text-[#36A2EB] hover:underline text-left"
                  onClick={() => router.push(`/hospital/${r.hospital.id}`)}
                  aria-label={`병원 상세로 이동: ${r.hospital.name}`}
                >
                  {r.hospital.name}
                </button>
                <span className="text-[#FFCE56] text-lg">{"★".repeat(r.rating)}<span className="text-gray-300">{"★".repeat(5 - r.rating)}</span></span>
                <span className="text-gray-800 text-sm">{r.content}</span>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                <div className="flex gap-2 mt-1">
                  <button
                    className="px-2 py-1 rounded bg-[#E3F2FD] text-[#36A2EB] text-xs font-semibold hover:brightness-110 transition"
                    onClick={() => setEditReview(r)}
                    aria-label="리뷰 수정"
                  >수정</button>
                  <button
                    className="px-2 py-1 rounded bg-[#FFCDD2] text-[#D32F2F] text-xs font-semibold hover:brightness-110 transition"
                    onClick={async () => {
                      if (!window.confirm("리뷰를 삭제하시겠습니까?")) return;
                      setLoading(true);
                      setError("");
                      const token = localStorage.getItem("token");
                      const res = await fetch(`/api/reviews/${r.id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      setLoading(false);
                      if (res.ok) {
                        setReviews(prev => prev.filter(x => x.id !== r.id));
                      } else {
                        setError("리뷰 삭제에 실패했습니다.");
                      }
                    }}
                    aria-label="리뷰 삭제"
                  >삭제</button>
                </div>
                {editReview && editReview.id === r.id && (
                  <ReviewEditModal
                    review={r}
                    onClose={() => setEditReview(null)}
                    onSave={async (content, rating) => {
                      setLoading(true);
                      setError("");
                      const token = localStorage.getItem("token");
                      const res = await fetch(`/api/reviews/${r.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ content, rating }),
                      });
                      setLoading(false);
                      if (res.ok) {
                        setReviews(prev => prev.map(x => x.id === r.id ? { ...x, content, rating } : x));
                        setEditReview(null);
                      } else {
                        setError("리뷰 수정에 실패했습니다.");
                      }
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
} 