"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface Hospital {
  id: number;
  name: string;
  address: string;
  phone?: string;
  openHours?: string;
  imageUrls?: string[];
}
interface Review {
  id: number;
  rating: number;
  content: string;
  createdAt: string;
  user: { id: number; name: string };
}
interface Reservation {
  id: number;
  reservedAt: string;
  status: string;
  memo?: string;
  user: { id: number; name: string };
}

export default function HospitalAdminDashboard() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selected, setSelected] = useState<Hospital | null>(null);
  const [tab, setTab] = useState<'info'|'reviews'|'reservations'|'stats'>('info');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  interface Stats {
    reservationCount: number;
    reviewCount: number;
    avgRating: number;
    monthlyReservations: { month: string; count: number }[];
    monthlyReviews: { month: string; count: number; avgRating: number }[];
  }
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    setLoading(true);
    fetch("/api/hospitals?mine=1", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then((data: { hospitals: Hospital[] }) => { setHospitals(data.hospitals || []); setLoading(false); })
      .catch(() => { setError("병원 목록을 불러오지 못했습니다."); setLoading(false); });
  }, [router]);

  // 병원 선택 시 리뷰/예약/통계 fetch
  useEffect(() => {
    if (!selected) return;
    const token = localStorage.getItem("token");
    setLoading(true);
    Promise.all([
      fetch(`/api/hospitals/${selected.id}/reviews`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch(`/api/hospitals/${selected.id}/reservations`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch(`/api/hospitals/${selected.id}/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
    ]).then(([
      r,
      rv,
      st
    ]: [
      { reviews: Review[] },
      { reservations: Reservation[] },
      { stats: Stats }
    ]) => {
      setReviews(r.reviews || []);
      setReservations(rv.reservations || []);
      setStats(st.stats || null);
      setLoading(false);
    }).catch(() => { setError("데이터를 불러오지 못했습니다."); setLoading(false); });
  }, [selected]);

  return (
    <main className="min-h-screen bg-[#F7FAFC] flex flex-col items-center p-8">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-[#36A2EB] mb-6">병원업체 대시보드</h1>
        <p className="mb-4 text-gray-600 text-sm">본인이 관리자로 등록된 병원만 목록/리뷰/예약/통계를 볼 수 있습니다.</p>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        {hospitals.length > 0 && (
          <div className="mb-4 flex gap-2 flex-wrap">
            {hospitals.map(h => (
              <button key={h.id} className={`px-3 py-1 rounded ${selected?.id===h.id?"bg-[#36A2EB] text-white":"bg-gray-100 text-gray-700"} font-semibold`} onClick={()=>setSelected(h)}>{h.name}</button>
            ))}
          </div>
        )}
        {!selected && hospitals.length > 0 && <div className="text-gray-400 mb-4">병원을 선택하세요.</div>}
        {selected && (
          <>
            <div className="mb-4 flex gap-2">
              <button className={`px-4 py-2 rounded font-semibold ${tab==='info'?"bg-[#36A2EB] text-white":"bg-gray-100 text-gray-700"}`} onClick={()=>setTab('info')}>병원정보</button>
              <button className={`px-4 py-2 rounded font-semibold ${tab==='reviews'?"bg-[#4BC0C0] text-white":"bg-gray-100 text-gray-700"}`} onClick={()=>setTab('reviews')}>리뷰</button>
              <button className={`px-4 py-2 rounded font-semibold ${tab==='reservations'?"bg-[#FFCE56] text-white":"bg-gray-100 text-gray-700"}`} onClick={()=>setTab('reservations')}>예약</button>
              <button className={`px-4 py-2 rounded font-semibold ${tab==='stats'?"bg-[#388E3C] text-white":"bg-gray-100 text-gray-700"}`} onClick={()=>setTab('stats')}>통계</button>
            </div>
            {tab==='info' && (
              <div className="mb-4">
                <div className="font-bold text-lg text-[#36A2EB]">{selected.name}</div>
                <div className="text-gray-700">주소: {selected.address}</div>
                <div className="text-gray-700">전화: {selected.phone||'-'}</div>
                <div className="text-gray-700">운영 시간: {selected.openHours||'-'}</div>
                <div className="text-gray-700">이미지: {selected.imageUrls?.join(', ')||'-'}</div>
              </div>
            )}
            {tab==='reviews' && (
              <div className="mb-4">
                <div className="font-bold mb-2">리뷰 목록</div>
                {loading ? <div className="text-gray-400">불러오는 중...</div> : (
                  <ul className="divide-y divide-gray-100">
                    {reviews.map(r => (
                      <li key={r.id} className="py-2">
                        <span className="text-[#FFCE56]">{'★'.repeat(r.rating)}</span>
                        <span className="ml-2 text-gray-800">{r.content}</span>
                        <span className="ml-2 text-xs text-gray-400">{r.user.name}</span>
                        <span className="ml-2 text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {reviews.length === 0 && <div className="text-gray-400">리뷰가 없습니다.</div>}
              </div>
            )}
            {tab==='reservations' && (
              <div className="mb-4">
                <div className="font-bold mb-2">예약 내역</div>
                {loading ? <div className="text-gray-400">불러오는 중...</div> : (
                  <ul className="divide-y divide-gray-100">
                    {reservations.map(r => (
                      <li key={r.id} className="py-2">
                        <span className="text-gray-800">{r.user.name}</span>
                        <span className="ml-2 text-gray-700">{new Date(r.reservedAt).toLocaleString()}</span>
                        <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100">{r.status}</span>
                        {r.memo && <span className="ml-2 text-xs text-gray-400">메모: {r.memo}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {reservations.length === 0 && <div className="text-gray-400">예약 내역이 없습니다.</div>}
              </div>
            )}
            {tab==='stats' && (
              <div className="mb-4">
                <div className="font-bold mb-2 text-[#388E3C]">통계</div>
                {stats ? (
                  <>
                    {/* 요약 카드 */}
                    <div className="flex gap-4 mb-6 flex-wrap">
                      <div className="bg-[#36A2EB]/10 border border-[#36A2EB]/30 rounded-lg p-4 min-w-[120px] text-center">
                        <div className="text-2xl font-bold text-[#36A2EB]">{stats.reservationCount}</div>
                        <div className="text-xs text-gray-500 mt-1">전체 예약수</div>
                      </div>
                      <div className="bg-[#FFCE56]/10 border border-[#FFCE56]/30 rounded-lg p-4 min-w-[120px] text-center">
                        <div className="text-2xl font-bold text-[#FFCE56]">{stats.reviewCount}</div>
                        <div className="text-xs text-gray-500 mt-1">전체 리뷰수</div>
                      </div>
                      <div className="bg-[#4BC0C0]/10 border border-[#4BC0C0]/30 rounded-lg p-4 min-w-[120px] text-center">
                        <div className="text-2xl font-bold text-[#4BC0C0]">{stats.avgRating ? stats.avgRating.toFixed(2) : '-'}</div>
                        <div className="text-xs text-gray-500 mt-1">평균 평점</div>
                      </div>
                    </div>
                    {/* 바차트 */}
                    <div className="mb-8 bg-white rounded-xl shadow p-4">
                      <h3 className="font-semibold mb-2 text-[#36A2EB]">월별 예약수/리뷰수</h3>
                      <Bar data={{
                        labels: (stats.monthlyReservations||[]).map((m) => m.month),
                        datasets: [
                          {
                            label: '예약수',
                            data: (stats.monthlyReservations||[]).map((m) => m.count),
                            backgroundColor: '#36A2EB',
                          },
                          {
                            label: '리뷰수',
                            data: (stats.monthlyReviews||[]).map((m) => m.count),
                            backgroundColor: '#FFCE56',
                          },
                        ],
                      }} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                    </div>
                    {/* 라인차트 */}
                    <div className="mb-8 bg-white rounded-xl shadow p-4">
                      <h3 className="font-semibold mb-2 text-[#4BC0C0]">월별 평균 평점</h3>
                      <Line data={{
                        labels: (stats.monthlyReviews||[]).map((m) => m.month),
                        datasets: [
                          {
                            label: '평균 평점',
                            data: (stats.monthlyReviews||[]).map((m) => m.avgRating ? Number(m.avgRating) : null),
                            borderColor: '#4BC0C0',
                            backgroundColor: 'rgba(75,192,192,0.2)',
                            tension: 0.3,
                            spanGaps: true,
                          },
                        ],
                      }} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } } }} />
                    </div>
                  </>
                ) : <div className="text-gray-400">통계 데이터가 없습니다.</div>}
              </div>
            )}
          </>
        )}
        {!loading && hospitals.length === 0 && <div className="text-gray-400 text-center py-8">관리자로 등록된 병원이 없습니다.</div>}
      </div>
    </main>
  );
} 