"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { fetchApi } from "@/utils/api";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  profile_image: string | null;
  role: string;
}

interface Space {
  id: string;
  title: string;
  description: string;
  address: string;
  addressSummary: string;
  latitude: string | number;
  longitude: string | number;
  capacity: number;
  priceDaily: number;
  priceWeekly: number | null;
  priceMonthly: number | null;
  isInstantBook: boolean;
  amenities: { amenity: string }[];
  images: { url: string }[];
}

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isMapView, setIsMapView] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // 로컬 스토리지에서 세션 확인
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("access_token");
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setIsMapView(true); // 로그인 상태이면 바로 지도로 진입
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  // 공간 API 데이터 로드
  useEffect(() => {
    if (isMapView) {
      const loadSpaces = async () => {
        try {
          const data = await fetchApi("/spaces");
          setSpaces(data || []);
        } catch (e) {
          console.error("공간 로딩 실패:", e);
        }
      };
      loadSpaces();
    }
  }, [isMapView]);

  // 카카오 지도 초기화 및 마커 렌더링
  useEffect(() => {
    if (!isMapView || !mapContainerRef.current) return;

    const initializeMap = () => {
      const kakao = (window as any).kakao;
      if (!kakao || !kakao.maps) return;

      kakao.maps.load(() => {
        // 기본 서울 시청 중심부 좌표
        const defaultCenter = new kakao.maps.LatLng(37.5665, 126.9780);
        
        // 지도 인스턴스 생성
        const mapOptions = {
          center: defaultCenter,
          level: 4,
        };
        const mapInstance = new kakao.maps.Map(mapContainerRef.current, mapOptions);
        mapRef.current = mapInstance;
        setMapLoaded(true);

        // 지도 빈곳 클릭 시 상세 카드 닫기
        kakao.maps.event.addListener(mapInstance, "click", () => {
          setSelectedSpace(null);
        });
      });
    };

    // 브라우저에 카카오 맵 SDK가 마운트될 때까지 대기 후 실행
    const checkKakaoMap = setInterval(() => {
      const kakao = (window as any).kakao;
      if (kakao && kakao.maps) {
        clearInterval(checkKakaoMap);
        initializeMap();
      }
    }, 100);

    return () => clearInterval(checkKakaoMap);
  }, [isMapView]);

  // 공간 리스트가 변경되거나 지도 초기화 완료 시 마커를 지도 위에 맵핑
  useEffect(() => {
    const kakao = (window as any).kakao;
    if (!mapLoaded || !mapRef.current || !kakao || !kakao.maps) return;

    // 기존 마커들 전체 제거
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (spaces.length === 0) return;

    const bounds = new kakao.maps.LatLngBounds();

    spaces.forEach(space => {
      const lat = Number(space.latitude);
      const lng = Number(space.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const position = new kakao.maps.LatLng(lat, lng);
      
      // 마커 생성
      const marker = new kakao.maps.Marker({
        position: position,
        map: mapRef.current,
      });

      // 마커 클릭 이벤트 바인딩
      kakao.maps.event.addListener(marker, "click", () => {
        setSelectedSpace(space);
        mapRef.current.panTo(position); // 마커 중심으로 스무스하게 스위칭
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // 다수의 마커가 있을 경우 모든 마커가 보이도록 지도의 중심 및 레벨을 자동 조정
    if (spaces.length > 0) {
      mapRef.current.setBounds(bounds);
    }
  }, [spaces, mapLoaded]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    setUser(null);
    setIsMapView(false);
    setSelectedSpace(null);
  };

  // 카카오 로그인 링크 조립
  const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const KAKAO_REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
  const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;

  // 1. 지도 모드 뷰포트
  if (isMapView) {
    return (
      <div className="flex flex-col flex-1 h-screen text-white relative">
        {/* 헤더 */}
        <header className="flex justify-between items-center px-4 py-3 bg-zinc-900 border-b border-zinc-800 z-10">
          <div className="text-md font-bold tracking-wider text-orange-500">
            BINJARI MAP
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/host/space/register"
              className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition font-medium"
            >
              공간 등록 🔗
            </Link>
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white transition"
            >
              로그아웃
            </button>
          </div>
        </header>

        {/* 카카오 지도 영역 */}
        <div ref={mapContainerRef} className="flex-1 w-full bg-zinc-950" />

        {/* 선택한 오피스 공간 요약 정보 오버레이 카드 */}
        {selectedSpace && (
          <div className="absolute bottom-6 left-4 right-4 z-10 max-w-[418px] mx-auto transition-all duration-300 transform translate-y-0">
            <div className="p-4 rounded-2xl glass shadow-2xl flex gap-4 items-center">
              {/* 이미지 썸네일 */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-500 flex-shrink-0 flex items-center justify-center font-bold text-lg text-white">
                {selectedSpace.images && selectedSpace.images[0] ? (
                  <img
                    src={selectedSpace.images[0].url}
                    alt={selectedSpace.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "BIN"
                )}
              </div>

              {/* 텍스트 설명 */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-orange-400 font-semibold tracking-wider uppercase mb-0.5">
                  {selectedSpace.addressSummary}
                </div>
                <h3 className="text-sm font-bold truncate text-white">
                  {selectedSpace.title}
                </h3>
                <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                  <span>수용 {selectedSpace.capacity}석</span>
                  <span>•</span>
                  <span>
                    편의시설 {selectedSpace.amenities ? selectedSpace.amenities.length : 0}개
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white mt-2">
                  ₩{Number(selectedSpace.priceDaily).toLocaleString()} <span className="text-[10px] text-zinc-400 font-medium">/ 일</span>
                </div>
              </div>

              {/* 예약/상세보기 */}
              <button 
                onClick={() => alert(`${selectedSpace.title} 예약 기능은 준비 중입니다!`)}
                className="btn-primary px-4 py-2.5 rounded-lg text-xs font-bold"
              >
                예약
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. 비로그인 랜딩 페이지
  return (
    <div className="flex flex-col flex-1 justify-between px-6 py-12 text-white">
      <header className="flex justify-between items-center">
        <div className="text-xl font-bold tracking-wider text-orange-500">
          BINJARI
        </div>
      </header>

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

        <div className="mt-8">
          <div className="flex flex-col gap-3">
            <a
              href={kakaoLoginUrl}
              className="w-full flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FDD200] text-[#191919] font-bold py-4 px-6 rounded-2xl transition duration-200 text-sm shadow-md"
            >
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
        </div>
      </main>

      <footer className="text-[10px] text-zinc-600 text-center">
        © 2026 BINJARI Co. All rights reserved.
      </footer>
    </div>
  );
}
