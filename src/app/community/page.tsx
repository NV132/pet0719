"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";

interface Post {
  id: number;
  title: string;
  content: string;
  category?: string;
  createdAt: string;
  user: { id: number; name: string };
}

const categories = ["전체", "Q&A", "자유", "정보", "후기"];

// 모달 포커스 트랩 유틸
function useFocusTrap(modalRef: React.RefObject<HTMLDivElement>, isOpen: boolean, onClose: () => void, restoreFocusRef?: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const node = modalRef.current;
    const focusable = node.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const prevActive = document.activeElement as HTMLElement;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Tab") {
        if (focusable.length === 0) return;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
      if (e.key === "Escape") onClose();
    }
    node.addEventListener("keydown", handleKeyDown);
    // 스크롤 잠금
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // 포커스 첫번째로 이동
    setTimeout(() => { first?.focus(); }, 0);
    return () => {
      node.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      // 모달 닫힘 후 포커스 복원
      if (restoreFocusRef?.current) restoreFocusRef.current.focus();
      else prevActive?.focus();
    };
  }, [isOpen, modalRef, onClose, restoreFocusRef]);
}

function WriteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useFocusTrap(modalRef, true, onClose, triggerRef);

  // ESC/배경 클릭 닫기, 포커스 관리
  useEffect(() => {
    firstInputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title || !content) {
      setError("제목과 내용을 입력하세요.");
      return;
    }
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch("/api/community", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ title, content, category: category === "전체" ? undefined : category }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } else {
      const data = await res.json();
      setError(data.error || "글 등록에 실패했습니다.");
    }
  };

  return (
    <div ref={modalRef} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="글쓰기 모달" onClick={handleBackdrop}>
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative outline-none" onClick={e => e.stopPropagation()} tabIndex={-1}>
        <button onClick={onClose} aria-label="닫기" className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-[#36A2EB] focus:outline-none">×</button>
        <h2 className="text-xl font-bold mb-4 text-[#36A2EB]" id="write-modal-title">글쓰기</h2>
        <form className="grid gap-4" onSubmit={handleSubmit} aria-labelledby="write-modal-title">
          <input ref={firstInputRef} value={title} onChange={e => setTitle(e.target.value)} className="input focus:ring-2 focus:ring-[#36A2EB] focus:outline-none" placeholder="제목" required aria-label="제목" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="input focus:ring-2 focus:ring-[#36A2EB] focus:outline-none" aria-label="카테고리 선택">
            {categories.map(c => <option key={c} value={c === "전체" ? "" : c}>{c}</option>)}
          </select>
          <textarea value={content} onChange={e => setContent(e.target.value)} className="input focus:ring-2 focus:ring-[#36A2EB] focus:outline-none" placeholder="내용" rows={5} required aria-label="내용" />
          {error && <div className="text-red-500 text-sm" role="alert">{error}</div>}
          {success && <div className="text-green-600 text-sm" role="status">글이 등록되었습니다.</div>}
          <button type="submit" className="px-6 py-3 rounded bg-[#36A2EB] text-white font-semibold hover:brightness-110 transition focus:ring-2 focus:ring-[#36A2EB] focus:outline-none" disabled={loading} aria-label="글 등록">
            {loading ? "등록 중..." : "글 등록"}
          </button>
        </form>
      </div>
    </div>
  );
}

// 신고 모달 컴포넌트
function ReportModal({ postId, commentId, onClose }: { postId?: number; commentId?: number; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!reason) { setError("신고 사유를 입력하세요."); return; }
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch("/api/community/report", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ postId, commentId, reason }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(onClose, 1000);
    } else {
      const data = await res.json();
      setError(data.error || "신고에 실패했습니다.");
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="신고 모달">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button onClick={onClose} aria-label="닫기" className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-600">×</button>
        <h2 className="text-xl font-bold mb-4 text-[#FF4D4F]">신고하기</h2>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <textarea value={reason} onChange={e => setReason(e.target.value)} className="input" placeholder="신고 사유를 입력하세요" rows={4} required aria-label="신고 사유" />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">신고가 접수되었습니다.</div>}
          <button type="submit" className="px-6 py-3 rounded bg-[#FF4D4F] text-white font-semibold hover:brightness-110 transition" disabled={loading}>{loading ? "신고 중..." : "신고하기"}</button>
        </form>
      </div>
    </div>
  );
}

// 상세/수정/삭제 모달 컴포넌트 추가
function DetailModal({ post, onClose, onEdit, onDelete, isMine }: { post: Post; onClose: () => void; onEdit: () => void; onDelete: () => void; isMine: boolean }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, true, onClose, closeBtnRef);
  useEffect(() => {
    closeBtnRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };
  // 좋아요 상태/카운트
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  useEffect(() => {
    // 좋아요 카운트/상태 fetch
    fetch(`/api/community/${post.id}`)
      .then(res => res.json())
      .then(data => {
        setLikeCount(data.post.likes?.length || 0);
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("token");
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setUserId(Number(payload.id));
            setLiked(!!data.post.likes?.find((l: any) => l.userId === Number(payload.id)));
          }
        }
      });
  }, [post.id]);
  // 좋아요 토글
  const handleLike = async () => {
    if (!userId) return;
    setLikeLoading(true);
    const token = localStorage.getItem("token");
    const method = liked ? "DELETE" : "POST";
    const res = await fetch(`/api/community/${post.id}/like`, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setLikeLoading(false);
    if (res.ok) {
      setLiked(!liked);
      setLikeCount(c => liked ? c - 1 : c + 1);
    }
  };
  const [showReport, setShowReport] = useState(false);
  return (
    <div ref={modalRef} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="게시글 상세 모달" onClick={handleBackdrop}>
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative outline-none" onClick={e => e.stopPropagation()} tabIndex={-1}>
        <button ref={closeBtnRef} onClick={onClose} aria-label="닫기" className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-[#36A2EB] focus:outline-none">×</button>
        <h2 className="text-xl font-bold mb-2 text-[#36A2EB]" id="detail-modal-title">{post.title}</h2>
        <div className="flex gap-2 items-center mb-2">
          <span className="text-[#36A2EB] font-semibold">{post.user.name}</span>
          <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</span>
          {post.category && <span className="text-xs px-2 py-1 rounded bg-[#E3F2FD] text-[#36A2EB] ml-2">{post.category}</span>}
        </div>
        <div className="text-gray-800 mb-4 whitespace-pre-line">{post.content}</div>
        {/* 좋아요 버튼/카운트 */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={handleLike} disabled={likeLoading || !userId} aria-label={liked ? "좋아요 취소" : "좋아요"} className={`text-2xl ${liked ? "text-[#FFCE56]" : "text-gray-300"}`}>★</button>
          <span className="text-sm text-gray-600">{likeCount}명</span>
          {/* 신고 버튼 */}
          <button onClick={() => setShowReport(true)} className="ml-2 px-2 py-1 rounded bg-[#FF4D4F] text-white text-xs" aria-label="글 신고">신고</button>
        </div>
        {isMine && (
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 rounded bg-[#36A2EB] text-white font-semibold hover:brightness-110 transition focus:ring-2 focus:ring-[#36A2EB] focus:outline-none" onClick={onEdit} aria-label="수정">수정</button>
            <button className="px-4 py-2 rounded bg-red-500 text-white font-semibold hover:brightness-110 transition focus:ring-2 focus:ring-red-500 focus:outline-none" onClick={onDelete} aria-label="삭제">삭제</button>
          </div>
        )}
        {/* 댓글/대댓글 */}
        <CommentList postId={post.id} userId={userId} />
        {showReport && <ReportModal postId={post.id} onClose={() => setShowReport(false)} />}
      </div>
    </div>
  );
}

function EditModal({ post, onClose, onSuccess }: { post: Post; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState(post.category || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, true, onClose, firstInputRef);

  useEffect(() => {
    firstInputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title || !content) {
      setError("제목과 내용을 입력하세요.");
      return;
    }
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`/api/community/${post.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ title, content, category: category === "전체" ? undefined : category }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } else {
      const data = await res.json();
      setError(data.error || "수정에 실패했습니다.");
    }
  };

  return (
    <div ref={modalRef} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="글 수정 모달" onClick={handleBackdrop}>
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative outline-none" onClick={e => e.stopPropagation()} tabIndex={-1}>
        <button onClick={onClose} aria-label="닫기" className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-[#36A2EB] focus:outline-none">×</button>
        <h2 className="text-xl font-bold mb-4 text-[#36A2EB]" id="edit-modal-title">글 수정</h2>
        <form className="grid gap-4" onSubmit={handleSubmit} aria-labelledby="edit-modal-title">
          <input ref={firstInputRef} value={title} onChange={e => setTitle(e.target.value)} className="input focus:ring-2 focus:ring-[#36A2EB] focus:outline-none" placeholder="제목" required aria-label="제목" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="input focus:ring-2 focus:ring-[#36A2EB] focus:outline-none" aria-label="카테고리 선택">
            {categories.map(c => <option key={c} value={c === "전체" ? "" : c}>{c}</option>)}
          </select>
          <textarea value={content} onChange={e => setContent(e.target.value)} className="input focus:ring-2 focus:ring-[#36A2EB] focus:outline-none" placeholder="내용" rows={5} required aria-label="내용" />
          {error && <div className="text-red-500 text-sm" role="alert">{error}</div>}
          {success && <div className="text-green-600 text-sm" role="status">글이 수정되었습니다.</div>}
          <button type="submit" className="px-6 py-3 rounded bg-[#36A2EB] text-white font-semibold hover:brightness-110 transition focus:ring-2 focus:ring-[#36A2EB] focus:outline-none" disabled={loading} aria-label="수정 저장">
            {loading ? "수정 중..." : "수정 저장"}
          </button>
        </form>
      </div>
    </div>
  );
}

// 댓글/대댓글 컴포넌트
function CommentList({ postId, userId }: { postId: number; userId: number | null }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<number | null>(null); // 대댓글 작성용
  const [replyContent, setReplyContent] = useState<{ [key: number]: string }>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [reportCommentId, setReportCommentId] = useState<number | null>(null);
  const fetchComments = useCallback(() => {
    setLoading(true);
    fetch(`/api/community/${postId}/comment`)
      .then(res => res.json())
      .then(data => {
        setComments(data.comments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postId]);
  useEffect(() => { fetchComments(); }, [fetchComments]);
  // 댓글 작성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!content) { setError("내용을 입력하세요."); return; }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`/api/community/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ content }),
    });
    if (res.ok) { setContent(""); fetchComments(); }
    else { const data = await res.json(); setError(data.error || "등록 실패"); }
  };
  // 대댓글 작성
  const handleReply = async (parentCommentId: number) => {
    if (!replyContent[parentCommentId]) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`/api/community/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ content: replyContent[parentCommentId], parentCommentId }),
    });
    if (res.ok) { setReplyContent(rc => ({ ...rc, [parentCommentId]: "" })); fetchComments(); }
  };
  // 댓글/대댓글 삭제
  const handleDelete = async (id: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`/api/community/${postId}/comment/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) fetchComments();
  };
  // 댓글/대댓글 수정
  const handleEdit = async (id: number) => {
    if (!editContent) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`/api/community/${postId}/comment/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ content: editContent }),
    });
    if (res.ok) { setEditId(null); setEditContent(""); fetchComments(); }
  };
  return (
    <section className="mt-8">
      <h3 className="text-lg font-bold mb-2 text-[#36A2EB]">댓글</h3>
      <form className="flex gap-2 mb-4" onSubmit={handleSubmit}>
        <input value={content} onChange={e => setContent(e.target.value)} className="input flex-1" placeholder="댓글을 입력하세요" aria-label="댓글 입력" />
        <button type="submit" className="px-4 py-2 rounded bg-[#36A2EB] text-white font-semibold" aria-label="댓글 등록">등록</button>
      </form>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {loading ? <div className="text-gray-400">불러오는 중...</div> : (
        <ul className="divide-y divide-gray-100">
          {comments.map(c => (
            <li key={c.id} className="py-2">
              <div className="flex gap-2 items-center">
                <span className="font-semibold text-[#36A2EB]">{c.user.name}</span>
                <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                {userId === c.user.id && (
                  <>
                    <button className="text-xs text-[#36A2EB] ml-2" onClick={() => { setEditId(c.id); setEditContent(c.content); }}>수정</button>
                    <button className="text-xs text-red-500 ml-1" onClick={() => handleDelete(c.id)}>삭제</button>
                  </>
                )}
                {/* 댓글 신고 버튼 */}
                <button className="text-xs text-[#FF4D4F] ml-2" onClick={() => setReportCommentId(c.id)} aria-label="댓글 신고">신고</button>
              </div>
              {editId === c.id ? (
                <div className="flex gap-2 mt-1">
                  <input value={editContent} onChange={e => setEditContent(e.target.value)} className="input flex-1" />
                  <button className="px-2 py-1 rounded bg-[#36A2EB] text-white text-xs" onClick={() => handleEdit(c.id)}>저장</button>
                  <button className="px-2 py-1 rounded bg-gray-200 text-xs" onClick={() => setEditId(null)}>취소</button>
                </div>
              ) : (
                <div className="text-gray-800 text-sm mt-1 whitespace-pre-line">{c.content}</div>
              )}
              {/* 대댓글 */}
              <div className="ml-4 mt-1">
                {c.childComments?.map((r: any) => (
                  <div key={r.id} className="mb-1">
                    <span className="font-semibold text-[#4BC0C0]">{r.user?.name || "익명"}</span>
                    <span className="text-xs text-gray-400 ml-1">{new Date(r.createdAt).toLocaleString()}</span>
                    {userId === r.userId && (
                      <>
                        <button className="text-xs text-[#36A2EB] ml-2" onClick={() => { setEditId(r.id); setEditContent(r.content); }}>수정</button>
                        <button className="text-xs text-red-500 ml-1" onClick={() => handleDelete(r.id)}>삭제</button>
                      </>
                    )}
                    {/* 대댓글 신고 버튼 */}
                    <button className="text-xs text-[#FF4D4F] ml-2" onClick={() => setReportCommentId(r.id)} aria-label="대댓글 신고">신고</button>
                    {editId === r.id ? (
                      <div className="flex gap-2 mt-1">
                        <input value={editContent} onChange={e => setEditContent(e.target.value)} className="input flex-1" />
                        <button className="px-2 py-1 rounded bg-[#36A2EB] text-white text-xs" onClick={() => handleEdit(r.id)}>저장</button>
                        <button className="px-2 py-1 rounded bg-gray-200 text-xs" onClick={() => setEditId(null)}>취소</button>
                      </div>
                    ) : (
                      <div className="text-gray-800 text-xs mt-1 whitespace-pre-line">{r.content}</div>
                    )}
                  </div>
                ))}
                {/* 대댓글 입력 */}
                <form className="flex gap-2 mt-1" onSubmit={e => { e.preventDefault(); handleReply(c.id); }}>
                  <input value={replyContent[c.id] || ""} onChange={e => setReplyContent(rc => ({ ...rc, [c.id]: e.target.value }))} className="input flex-1" placeholder="답글을 입력하세요" aria-label="답글 입력" />
                  <button type="submit" className="px-2 py-1 rounded bg-[#4BC0C0] text-white text-xs" aria-label="답글 등록">답글</button>
                </form>
              </div>
              {reportCommentId === c.id && <ReportModal commentId={c.id} onClose={() => setReportCommentId(null)} />}
            </li>
          ))}
        </ul>
      )}
      {/* 대댓글 신고 모달 */}
      {reportCommentId && !comments.find(c => c.id === reportCommentId) && <ReportModal commentId={reportCommentId} onClose={() => setReportCommentId(null)} />}
    </section>
  );
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWrite, setShowWrite] = useState(false);
  const [listKey, setListKey] = useState(0);
  // 상세/수정/삭제 상태 추가
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  // 무한 스크롤 관련
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });
  const LIMIT = 20;

  // 최초/카테고리/글쓰기 후 목록 초기화
  useEffect(() => {
    setLoading(true);
    setHasMore(true);
    setTotal(0);
    fetch(`/api/community?limit=${LIMIT}&offset=0${category && category !== "전체" ? `&category=${encodeURIComponent(category)}` : ""}`)
      .then(res => res.json())
      .then(data => {
        setPosts(data.posts || []);
        setTotal(data.total || 0);
        setHasMore((data.posts?.length || 0) < (data.total || 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, listKey]);

  // 추가 로딩(무한 스크롤)
  useEffect(() => {
    if (!inView || loading || fetchingMore || !hasMore) return;
    setFetchingMore(true);
    fetch(`/api/community?limit=${LIMIT}&offset=${posts.length}${category && category !== "전체" ? `&category=${encodeURIComponent(category)}` : ""}`)
      .then(res => res.json())
      .then(data => {
        setPosts(prev => [...prev, ...(data.posts || [])]);
        setHasMore(posts.length + (data.posts?.length || 0) < (data.total || total));
        setTotal(data.total || total);
        setFetchingMore(false);
      })
      .catch(() => setFetchingMore(false));
  }, [inView, loading, fetchingMore, hasMore, posts.length, category, total]);

  // 로그인 유저 ID 추출
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUserId(Number(payload.id));
        }
      } catch {}
    }
  }, []);

  // 상세 모달 열기
  const handlePostClick = async (postId: number) => {
    setLoading(true);
    const res = await fetch(`/api/community/${postId}`);
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setSelectedPost(data.post);
      setShowDetail(true);
    }
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!selectedPost) return;
    setDeleteLoading(true);
    setDeleteError("");
    setDeleteSuccess(false);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`/api/community/${selectedPost.id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setDeleteLoading(false);
    if (res.ok) {
      setDeleteSuccess(true);
      setTimeout(() => {
        setShowDetail(false);
        setSelectedPost(null);
        setListKey(k => k + 1);
      }, 1000);
    } else {
      const data = await res.json();
      setDeleteError(data.error || "삭제에 실패했습니다.");
    }
  };

  return (
    <main className="min-h-screen bg-[#F7FAFC] flex flex-col items-center p-8">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#36A2EB]">커뮤니티</h1>
          <button className="px-4 py-2 rounded bg-[#36A2EB] text-white font-semibold hover:brightness-110 transition" onClick={() => setShowWrite(true)}>글쓰기</button>
        </div>
        <div className="flex gap-2 mb-4">
          {categories.map(c => (
            <button key={c} className={`px-3 py-1 rounded ${category === c || (!category && c === "전체") ? "bg-[#FFCE56] text-gray-900 font-bold" : "bg-gray-100 text-gray-600"}`} onClick={() => setCategory(c === "전체" ? "" : c)}>{c}</button>
          ))}
        </div>
        {loading && <div className="text-gray-400">불러오는 중...</div>}
        {!loading && posts.length === 0 && <div className="text-gray-400">게시글이 없습니다.</div>}
        <ul className="divide-y divide-gray-100">
          {posts.map(p => (
            <li key={p.id} className="py-4 cursor-pointer hover:bg-gray-50 rounded transition" onClick={() => handlePostClick(p.id)}>
              <div className="flex gap-2 items-center mb-1">
                <span className="text-[#36A2EB] font-semibold">{p.user.name}</span>
                <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()}</span>
                {p.category && <span className="text-xs px-2 py-1 rounded bg-[#E3F2FD] text-[#36A2EB] ml-2">{p.category}</span>}
              </div>
              <div className="font-bold text-lg text-gray-800 mb-1">{p.title}</div>
              <div className="text-gray-700 text-sm line-clamp-2">{p.content}</div>
            </li>
          ))}
        </ul>
        {/* 무한 스크롤 로딩/마지막 안내 */}
        <div ref={loadMoreRef} style={{ height: 32 }} />
        {fetchingMore && <div className="text-gray-400 text-center mt-2">더 불러오는 중...</div>}
        {!hasMore && posts.length > 0 && <div className="text-gray-400 text-center mt-2">마지막 글입니다.</div>}
      </div>
      {showWrite && <WriteModal onClose={() => setShowWrite(false)} onSuccess={() => setListKey(k => k + 1)} />}
      {showDetail && selectedPost && (
        <DetailModal
          post={selectedPost}
          onClose={() => { setShowDetail(false); setSelectedPost(null); setDeleteError(""); setDeleteSuccess(false); }}
          onEdit={() => { setShowEdit(true); setShowDetail(false); }}
          onDelete={handleDelete}
          isMine={userId !== null && selectedPost.user.id === userId}
        />
      )}
      {showEdit && selectedPost && (
        <EditModal
          post={selectedPost}
          onClose={() => { setShowEdit(false); setSelectedPost(null); }}
          onSuccess={() => setListKey(k => k + 1)}
        />
      )}
      {/* 삭제 진행/에러/성공 메시지 */}
      {deleteLoading && <div className="fixed inset-0 flex items-center justify-center z-50"><div className="bg-white rounded-xl shadow-lg p-8">삭제 중...</div></div>}
      {deleteError && <div className="fixed inset-0 flex items-center justify-center z-50"><div className="bg-white rounded-xl shadow-lg p-8 text-red-500">{deleteError}</div></div>}
      {deleteSuccess && <div className="fixed inset-0 flex items-center justify-center z-50"><div className="bg-white rounded-xl shadow-lg p-8 text-green-600">삭제되었습니다.</div></div>}
    </main>
  );
} 