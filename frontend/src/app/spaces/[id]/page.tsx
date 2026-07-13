"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/utils/api";

interface SpaceDetail {
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
  images: { url: string; isPrimary: boolean }[];
}

export default function SpaceDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // 이미지 갤러리 현재 활성화 썸네일 인덱스
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // 공간 단일 상세 정보 로드
  useEffect(() => {
    if (!id) return;
    const loadDetail = async () => {
      try {
        const data = await fetchApi(`/spaces/${id}`);
        setSpace(data);
      } catch (err: any) {
        setError(err.message || "공간 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  // 상세 페이지용 미니 카카오 맵 초기화 훅
  useEffect(() => {
    if (!space || !mapContainerRef.current) return;

    const initializeMap = () => {
      const kakao = (window as any).kakao;
      if (!kakao || !kakao.maps) return;

      kakao.maps.load(() => {
        const container = mapContainerRef.current;
        if (!container) return;

        const lat = Number(space.latitude);
        const lng = Number(space.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const centerPosition = new kakao.maps.LatLng(lat, lng);
        const mapOptions = {
          center: centerPosition,
          level: 3,
        };

        const mapInstance = new kakao.maps.Map(container, mapOptions);
        mapRef.current = mapInstance;
        setMapLoaded(true);

        // 해당 상세 공간 위치에 마커 꽂기
        new kakao.maps.Marker({
          position: centerPosition,
          map: mapInstance,
        });
      });
    };

    const kakao = (window as any).kakao;
    if (kakao && kakao.maps && kakao.maps.load) {
      initializeMap();
      return;
    }

    const existingScript = document.getElementById("kakao-map-sdk");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "kakao-map-sdk";
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_CLIENT_KEY}&autoload=false`;
      script.async = true;
      script.onload = () => {
        initializeMap();
      };
      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        const k = (window as any).kakao;
        if (k && k.maps && k.maps.load) {
          clearInterval(checkInterval);
          initializeMap();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [space]);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center h-screen text-white bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mb-4" />
        <p className="text-xs text-zinc-400">오피스 상세 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center h-screen text-white px-6 text-center bg-zinc-950">
        <p className="text-sm text-red-400 font-bold mb-4">⚠️ {error || "공간 정보를 찾을 수 없습니다."}</p>
        <button
          onClick={() => router.back()}
          className="btn-primary px-6 py-3 rounded-xl text-xs font-bold"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  // 대표 이미지가 항상 먼저 뜨도록 정렬
  const sortedImages = [...space.images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return 0;
  });

  const getAmenityLabel = (type: string) => {
    const maps: Record<string, string> = {
      wifi: "🌐 고속 와이파이",
      parking: "🚗 주차 가능",
      phone_ok: "📞 전화통화 가능",
      video_call_ok: "💻 화상회의 가능",
      printer: "🖨️ 복합기 사용",
      kitchen: "☕ 주방 및 다과",
      locker: "🔑 개인 사물함",
      "24hours": "🔓 24시간 운영",
    };
    return maps[type] || type;
  };

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-white min-h-screen pb-[84px] relative">
      {/* 뒤로가기 플로팅 버튼 */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center font-bold hover:bg-black transition"
      >
        ←
      </button>

      {/* 이미지 갤러리 슬라이더 */}
      <div className="w-full aspect-[4/3] bg-zinc-900 relative overflow-hidden">
        {sortedImages.length > 0 ? (
          <>
            <img
              src={sortedImages[currentImgIndex].url}
              alt={space.title}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImgIndex(prev => (prev === 0 ? sortedImages.length - 1 : prev - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center font-bold text-sm transition hover:bg-black/60"
                >
                  ‹
                </button>
                <button
                  onClick={() => setCurrentImgIndex(prev => (prev === sortedImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center font-bold text-sm transition hover:bg-black/60"
                >
                  ›
                </button>
                <div className="absolute bottom-3 right-4 bg-black/60 px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-300">
                  {currentImgIndex + 1} / {sortedImages.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 font-bold text-sm">
            <span>등록된 사진이 없습니다.</span>
          </div>
        )}
      </div>

      {/* 공간 소개 정보 본문 */}
      <div className="px-5 py-6 flex flex-col gap-5">
        {/* 타이틀 및 요약 정보 */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] text-orange-500 font-bold tracking-wider uppercase">
            {space.addressSummary}
          </div>
          <h1 className="text-lg font-bold leading-snug">{space.title}</h1>
          <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5 font-medium">
            <span>수용 {space.capacity}석</span>
            <span>•</span>
            <span>즉시 예약 {space.isInstantBook ? "가능 ⚡" : "대기 ⏳"}</span>
          </div>
        </div>

        <hr className="border-zinc-900" />

        {/* 상세 설명 */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-zinc-300">공간 소개</h3>
          <p className="text-xs leading-relaxed text-zinc-400 whitespace-pre-line">
            {space.description}
          </p>
        </div>

        <hr className="border-zinc-900" />

        {/* 편의 시설 */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold text-zinc-300">제공 편의시설</h3>
          {space.amenities && space.amenities.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {space.amenities.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-3.5 text-xs text-zinc-300 font-medium"
                >
                  {getAmenityLabel(item.amenity)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">제공되는 편의시설이 없습니다.</p>
          )}
        </div>

        <hr className="border-zinc-900" />

        {/* 위치 지도 */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-xs font-bold text-zinc-300">상세 위치</h3>
            <p className="text-[11px] text-zinc-400">{space.address}</p>
          </div>
          {/* 미니 지도 컨테이너 */}
          <div
            ref={mapContainerRef}
            className="w-full h-44 rounded-2xl bg-zinc-900 border border-zinc-850 overflow-hidden z-0"
          />
        </div>
      </div>

      {/* 최하단 요금 및 예약신청 고정 플로팅 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-10 max-w-[450px] mx-auto border-t border-zinc-900 px-5 py-4.5 glass flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[9px] text-zinc-400 font-bold">1일 대여 이용 요금</span>
          <span className="text-md font-extrabold text-white">
            ₩{Number(space.priceDaily).toLocaleString()}
          </span>
        </div>
        <button
          onClick={() => alert("예약 기능은 다음 마일스톤에 추가됩니다! 조금만 기다려 주셔요!")}
          className="btn-primary px-5 py-3.5 rounded-xl text-xs font-bold shadow-lg"
        >
          예약 신청하기 ⚡
        </button>
      </div>
    </div>
  );
}
