"use client";

import { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  profile_image: string | null;
  role: string;
}

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // 로컬 스토리지에서 세션 확인
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("access_token");
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    setUser(null);
  };

  // 카카오 로그인 링크 조립
  const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const KAKAO_REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
  const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;

  return (
    <div className="flex flex-col flex-1 justify-between px-6 py-12 text-white">
      {/* 상단 로고 */}
      <header className="flex justify-between items-center">
        <div className="text-xl font-bold tracking-wider text-orange-500">
          BINJARI
        </div>
        {user && (
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-400 hover:text-white transition"
          >
            로그아웃
          </button>
        )}
      </header>

      {/* 메인 히어로 섹션 */}
      <main className="flex flex-col gap-6 my-auto">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-widest text-orange-500 uppercase">
            Office Sharing Platform
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            남는 자리를<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
              연결하다.
            </span>
          </h1>
        </div>

        <p className="text-sm leading-relaxed text-zinc-400 max-w-[280px]">
          기업의 비어 있는 사무실 책상을 프리랜서와 1인 창업자에게 합리적으로 대여하는 스마트 오피스 공유 서비스입니다.
        </p>

        {/* 사용자 상태에 따른 액션 버튼 */}
        <div className="mt-8">
          {user ? (
            <div className="flex flex-col gap-4">
              {/* 환영 안내 */}
              <div className="flex items-center gap-4 p-4 rounded-2xl glass">
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt={user.name}
                    className="w-12 h-12 rounded-full border border-zinc-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center font-bold">
                    {user.name.substring(0, 1)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-sm">{user.name}님 환영합니다!</div>
                  <div className="text-xs text-zinc-400">{user.email}</div>
                </div>
              </div>

              {/* 서비스 들어가기 */}
              <button className="w-full btn-primary py-4 text-sm font-semibold rounded-2xl">
                근처 빈자리 찾아보기 🔍
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* 카카오 로그인 버튼 (카카오 공식 옐로우 및 텍스트 적용) */}
              <a
                href={kakaoLoginUrl}
                className="w-full flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FDD200] text-[#191919] font-bold py-4 px-6 rounded-2xl transition duration-200 text-sm shadow-md"
              >
                {/* 간단한 카카오 말풍선 모양 아이콘 */}
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.87 1.9 5.378 4.793 6.786l-1.077 3.973c-.085.312.186.58.483.428l4.757-2.434c.343.031.691.047 1.044.047 5.523 0 10-3.582 10-8s-4.477-8-10-8z" />
                </svg>
                카카오로 시작하기
              </a>
              <span className="text-[10px] text-center text-zinc-500 mt-2">
                로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
              </span>
            </div>
          )}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="text-[10px] text-zinc-600 text-center">
        © 2026 BINJARI Co. All rights reserved.
      </footer>
    </div>
  );
}
