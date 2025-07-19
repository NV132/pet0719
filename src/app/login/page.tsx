"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function isEmail(email: string) {
  return /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email);
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({});

  const validate = (name: string, value: string) => {
    switch (name) {
      case "email":
        if (!isEmail(value)) return "이메일 형식이 올바르지 않습니다.";
        break;
      case "password":
        if (value.length < 8 || value.length > 32) return "비밀번호는 8~32자여야 합니다.";
        break;
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldError({ ...fieldError, [e.target.name]: validate(e.target.name, e.target.value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errors = {
      email: validate("email", form.email),
      password: validate("password", form.password),
    };
    setFieldError(errors);
    if (errors.email || errors.password) return;
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.token);
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.error || "로그인에 실패했습니다.");
    }
  };

  return (
    <main className="min-h-screen bg-[#F7FAFC] flex flex-col items-center p-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-[#36A2EB] mb-6">로그인</h1>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <input name="email" type="email" placeholder="이메일" value={form.email} onChange={handleChange} className="input" required />
          {fieldError.email && <div className="text-red-500 text-xs">{fieldError.email}</div>}
          <input name="password" type="password" placeholder="비밀번호" value={form.password} onChange={handleChange} className="input" required />
          {fieldError.password && <div className="text-red-500 text-xs">{fieldError.password}</div>}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" className="px-6 py-3 rounded bg-[#36A2EB] text-white font-semibold hover:brightness-110 transition" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
      <div className="mt-4 text-center">
        <span>계정이 없으신가요? </span>
        <a href="/signup" className="text-[#36A2EB] hover:underline font-semibold">회원가입</a>
      </div>
    </main>
  );
} 