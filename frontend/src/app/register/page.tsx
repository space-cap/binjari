"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "guest", // guest가 기본값
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role: string) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name || !formData.password) {
      setError("모든 필드를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1";
      const response = await fetch(`${backendUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || "회원가입 실패");
      }

      alert("회원가입이 완료되었습니다! 가입하신 정보로 로그인해 주세요.");
      router.push("/");
    } catch (err: any) {
      setError(err.message || "회원가입 과정에서 오차가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 justify-center px-6 py-12 text-white">
      {/* 뒤로 가기 */}
      <button
        onClick={() => router.back()}
        className="self-start text-xs text-zinc-400 hover:text-white mb-6 transition"
      >
        ← 홈으로 돌아가기
      </button>

      {/* 헤더 */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="text-xl font-bold tracking-wider text-orange-500">
          BINJARI
        </div>
        <h1 className="text-2xl font-bold leading-tight">
          간편 회원가입으로<br />빈자리를 시작해 보세요!
        </h1>
      </div>

      {/* 가입 폼 */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* 이메일 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-zinc-400">이메일 주소</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@binjari.com"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3.5 text-sm focus:border-orange-500 focus:outline-none"
            required
          />
        </div>

        {/* 이름 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-zinc-400">이름</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="홍길동"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3.5 text-sm focus:border-orange-500 focus:outline-none"
            required
          />
        </div>

        {/* 비밀번호 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-zinc-400">비밀번호</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="6자리 이상 비밀번호"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3.5 text-sm focus:border-orange-500 focus:outline-none"
            required
          />
        </div>

        {/* 역할 선택 (게스트 / 호스트) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-zinc-400 font-medium">나의 주된 역할</label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <button
              type="button"
              onClick={() => handleRoleChange("guest")}
              className={`py-3.5 rounded-xl text-xs font-bold border transition ${
                formData.role === "guest"
                  ? "bg-orange-500/10 border-orange-500 text-orange-500"
                  : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              🙋‍♂️ 게스트 (자리 구하기)
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("host")}
              className={`py-3.5 rounded-xl text-xs font-bold border transition ${
                formData.role === "host"
                  ? "bg-orange-500/10 border-orange-500 text-orange-500"
                  : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              🏢 호스트 (자리 쉐어하기)
            </button>
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-400 font-medium text-center mt-2">
            ⚠️ {error}
          </div>
        )}

        {/* 회원가입 제출 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-4 text-sm font-semibold rounded-2xl mt-4 disabled:opacity-40"
        >
          {loading ? "가입 처리 중..." : "회원가입 완료하기"}
        </button>
      </form>
    </div>
  );
}
