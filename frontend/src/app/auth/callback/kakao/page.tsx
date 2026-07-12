"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function KakaoCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("인증 코드 확인 중...");
  const [error, setError] = useState<string | null>(null);
  
  // React 18 strict mode 등에서 API가 중복 호출되는 것을 방지하기 위한 Lock 레퍼런스
  const isProcessing = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("인증 코드가 누락되었습니다.");
      return;
    }

    if (isProcessing.current) return;
    isProcessing.current = true;

    const processLogin = async () => {
      try {
        setStatus("카카오 토큰 발급 중...");

        // 1. 카카오 인가 코드로 카카오 Access Token 요청
        const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || "",
            redirect_uri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || "",
            code: code,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error("카카오 토큰 요청에 실패했습니다.");
        }

        const tokenData = await tokenResponse.json();
        const kakaoAccessToken = tokenData.access_token;

        setStatus("빈자리 서비스 로그인 처리 중...");

        // 2. 획득한 Kakao Access Token을 백엔드로 전송하여 JWT 발급
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1";
        const backendResponse = await fetch(`${backendUrl}/auth/kakao`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kakao_access_token: kakaoAccessToken,
          }),
        });

        if (!backendResponse.ok) {
          throw new Error("빈자리 서버 인증에 실패했습니다.");
        }

        const authData = await backendResponse.json();

        // 3. JWT 토큰 및 사용자 정보 보관
        localStorage.setItem("access_token", authData.access_token);
        localStorage.setItem("user", JSON.stringify(authData.user));

        setStatus("로그인 완료! 잠시 후 메인 화면으로 이동합니다.");

        setTimeout(() => {
          router.replace("/");
        }, 1000);
      } catch (err: any) {
        setError(err.message || "로그인 도중 오류가 발생했습니다.");
      }
    };

    processLogin();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col flex-1 justify-center items-center px-6 text-white text-center gap-6">
      {error ? (
        <div className="flex flex-col gap-4">
          <div className="text-3xl">⚠️</div>
          <div className="text-red-400 font-semibold">{error}</div>
          <button
            onClick={() => router.replace("/")}
            className="btn-primary py-3 px-6 text-xs rounded-xl mt-4"
          >
            홈으로 돌아가기
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl glass max-w-[280px]">
          {/* 로딩 스피너 애니메이션 */}
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm font-semibold mt-2">{status}</div>
          <div className="text-[10px] text-zinc-500">잠시만 기다려 주시면 로그인 세션이 안전하게 활성화됩니다.</div>
        </div>
      )}
    </div>
  );
}

// Next.js App Router 빌드 타임 Prerender 오류 우회를 위해 Suspense 바운더리로 감싸줍니다.
export default function KakaoCallback() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 justify-center items-center px-6 text-white text-center gap-6">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl glass max-w-[280px]">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm font-semibold mt-2">로딩 중...</div>
        </div>
      </div>
    }>
      <KakaoCallbackInner />
    </Suspense>
  );
}
