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

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface StatsInfo {
  avgRating: number;
  reviewCount: number;
}

export default function SpaceDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 리뷰 및 집계 평점 상태
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<StatsInfo | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // 이미지 갤러리 현재 활성화 썸네일 인덱스
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // 예약 설정 모달 상태 관리
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSeats, setBookingSeats] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // 예약 신청 요청 처리 핸들러
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate) {
      setBookingError("이용 예약일을 선택해 주세요.");
      return;
    }
    if (!space) return;

    setBookingLoading(true);
    setBookingError(null);

    try {
      await fetchApi("/bookings", {
        method: "POST",
        body: JSON.stringify({
          spaceId: space.id,
          checkInDate: bookingDate,
          seatCount: bookingSeats,
        }),
      });

      alert("🎉 예약 신청이 완료되었습니다!\n결제 화면으로 리다이렉트되어 최종 확정을 돕습니다.");
      setShowBookingModal(false);
      router.push("/bookings/my");
    } catch (err: any) {
      setBookingError(err.message || "예약 신청 처리 중 서버 에러가 발생했습니다.");
    } finally {
      setBookingLoading(false);
    }
  };

  // 공간 정보 + 누적 평점 통계 + 후기 피드 목록 통합 로드
  useEffect(() => {
    if (!id) return;
    const loadDetailData = async () => {
      try {
        const [spaceData, reviewsData, statsData] = await Promise.all([
          fetchApi(`/spaces/${id}`),
          fetchApi(`/reviews/space/${id}`),
          fetchApi(`/reviews/space/${id}/stats`),
        ]);
        setSpace(spaceData);
        setReviews(reviewsData || []);
        setStats(statsData || null);
      } catch (err: any) {
        setError(err.message || "공간 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadDetailData();
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

  // 이미지 절대 주소 보정 헬퍼 함수
  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const backendBase = "http://localhost:4000";
    return `${backendBase}${url}`;
  };

  // 0.5점 단위 채워진 반 별(🌗) 드로잉 헬퍼 (SVG 마스크 기법)
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 select-none">
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFull = rating >= starValue;
          const isHalf = rating === starValue - 0.5;

          return (
            <div key={starValue} className="relative w-3.5 h-3.5 flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                {/* 비어있는 뒷배경 별 */}
                <path
                  d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.45 13.97L5.82 21L12 17.27Z"
                  fill="#27272a"
                  stroke="#3f3f46"
                  strokeWidth="1.5"
                />
                {/* 채워지는 주황/노랑 별 */}
                {(isFull || isHalf) && (
                  <path
                    d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.45 13.97L5.82 21L12 17.27Z"
                    fill="#f59e0b"
                    clipPath={isHalf ? "url(#half-clip-detail)" : undefined}
                  />
                )}
              </svg>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-white min-h-screen pb-[84px] relative">
      {/* 클립패스 정의 SVG (반 별 조각 커팅용) */}
      <svg className="w-0 h-0 absolute">
        <defs>
          <clipPath id="half-clip-detail">
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
      </svg>

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
              src={getImageUrl(sortedImages[currentImgIndex].url)}
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
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-650 font-bold text-sm">
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
            <span>•</span>
            <span className="text-amber-400 font-bold">
              ⭐ {stats && stats.reviewCount > 0 ? `${stats.avgRating} (${stats.reviewCount}개 후기)` : "첫 후기 남기기"}
            </span>
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

        <hr className="border-zinc-900" />

        {/* 후기 피드 영역 */}
        <div className="flex flex-col gap-3 pb-4">
          <h3 className="text-xs font-bold text-zinc-300">이용 후기 및 평점</h3>
          {reviews.length > 0 ? (
            <div className="flex flex-col gap-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-zinc-900 border border-zinc-850 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-300">
                      {rev.user.name || "익명 게스트"}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">
                      {renderStars(rev.rating)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{rev.comment}</p>
                  <span className="text-[9px] text-zinc-600 self-end">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 py-3">
              아직 작성된 이용 후기가 없습니다. 첫 이용자가 되어 생생한 후기를 남겨주셔요!
            </p>
          )}
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
          onClick={() => {
            const today = new Date().toISOString().split("T")[0];
            setBookingDate(today);
            setBookingSeats(1);
            setBookingError(null);
            setShowBookingModal(true);
          }}
          className="btn-primary px-5 py-3.5 rounded-xl text-xs font-bold shadow-lg"
        >
          예약 신청하기 ⚡
        </button>
      </div>

      {/* 예약 상세 옵션 모달 오버레이 */}
      {showBookingModal && (
        <div className="fixed inset-0 z-20 bg-black/70 flex items-end justify-center px-4 max-w-[450px] mx-auto">
          <div className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 flex flex-col gap-6 animate-slideUp z-30">
            {/* 헤더 */}
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h2 className="text-sm font-bold">대여 정보 및 예약 신청</h2>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                닫기
              </button>
            </div>

            {/* 입력 폼 */}
            <form onSubmit={handleBookingSubmit} className="flex flex-col gap-5">
              {/* 예약일 지정 */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 font-bold">대여 이용일 선택</label>
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              {/* 이용석 수량 조절 */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 font-bold">대여 좌석 수 (최대 {space.capacity}석)</label>
                <div className="flex items-center gap-4 mt-1 bg-zinc-850 border border-zinc-750 rounded-xl px-4 py-2 justify-between">
                  <span className="text-xs font-semibold text-zinc-400">이용 인원석</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingSeats(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold flex items-center justify-center text-sm"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-white min-w-[20px] text-center">{bookingSeats}</span>
                    <button
                      type="button"
                      onClick={() => setBookingSeats(prev => Math.min(space.capacity, prev + 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 실시간 최종 예상 금액 표기 */}
              <div className="flex justify-between items-center p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 mt-1">
                <span className="text-xs text-zinc-400 font-medium">최종 예상 결제 금액</span>
                <span className="text-sm font-extrabold text-orange-500">
                  ₩{(space.priceDaily * bookingSeats).toLocaleString()}
                </span>
              </div>

              {bookingError && (
                <div className="text-[11px] text-red-400 font-medium text-center">
                  ⚠️ {bookingError}
                </div>
              )}

              {/* 제출 */}
              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full btn-primary py-4 text-xs font-bold rounded-xl mt-2 disabled:opacity-40"
              >
                {bookingLoading ? "예약 요청 중..." : "예약 최종 신청 완료 ⚡"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
