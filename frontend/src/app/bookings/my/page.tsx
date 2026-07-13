"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/utils/api";

interface BookingItem {
  id: string;
  spaceId: string;
  checkInDate: string;
  seatCount: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  space: {
    title: string;
    addressSummary: string;
    priceDaily: number;
    images: { url: string; isPrimary: boolean }[];
  };
}

export default function MyBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 세션 인증 체크
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("로그인이 필요합니다.");
      router.replace("/");
      return;
    }

    const loadMyBookings = async () => {
      try {
        const data = await fetchApi("/bookings/my");
        setBookings(data || []);
      } catch (err: any) {
        setError(err.message || "예약 내역을 가져오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadMyBookings();
  }, [router]);

  // 이미지 절대 주소 보정 헬퍼
  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const backendBase = "http://localhost:4000";
    return `${backendBase}${url}`;
  };

  // 날짜 가독성 변환
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  // 상태값 한글 라벨 및 스타일 뱃지 맵핑
  const renderStatusBadge = (status: BookingItem["status"]) => {
    const styles: Record<BookingItem["status"], { label: string; class: string }> = {
      pending: {
        label: "승인 대기 중 ⏳",
        class: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
      },
      confirmed: {
        label: "예약 확정 완료 ⚡",
        class: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
      },
      cancelled: {
        label: "예약 취소됨 ✕",
        class: "bg-red-500/10 text-red-500 border border-red-500/20",
      },
    };
    const style = styles[status] || { label: status, class: "bg-zinc-800 text-zinc-400" };
    return (
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${style.class}`}>
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center h-screen text-white bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mb-4" />
        <p className="text-xs text-zinc-400 font-medium">내 예약 목록 조회 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-white min-h-screen px-5 py-8 relative">
      {/* 헤더 */}
      <header className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← 홈 지도로 가기
        </button>
        <h1 className="text-sm font-extrabold text-orange-500 tracking-wider">
          MY BOOKINGS
        </h1>
      </header>

      {/* 대제목 */}
      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-2xl font-bold">나의 대여 신청 목록</h2>
        <p className="text-xs text-zinc-400">대여일에 맞춰 지정을 원활히 받으실 수 있습니다.</p>
      </div>

      {error && (
        <div className="text-xs text-red-400 font-semibold text-center py-4 bg-red-500/5 rounded-xl border border-red-500/10 mb-6">
          ⚠️ {error}
        </div>
      )}

      {/* 예약 리스트 */}
      <main className="flex flex-col gap-4">
        {bookings.length > 0 ? (
          bookings.map((item) => {
            const primaryImg = item.space.images.find(img => img.isPrimary) || item.space.images[0];
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl glass border border-zinc-850 flex gap-4 items-center"
              >
                {/* 썸네일 */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 relative">
                  {primaryImg ? (
                    <img
                      src={getImageUrl(primaryImg.url)}
                      alt={item.space.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-zinc-600 bg-zinc-900">
                      BINJARI
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {item.space.addressSummary}
                    </span>
                    {renderStatusBadge(item.status)}
                  </div>
                  
                  <h3 className="text-xs font-bold text-white truncate pr-1">
                    {item.space.title}
                  </h3>

                  <div className="text-[10px] text-zinc-400 flex flex-col gap-0.5 mt-0.5 font-medium">
                    <span>이용 날짜: {formatDate(item.checkInDate)}</span>
                    <span>대여 인원: {item.seatCount}석 대여</span>
                  </div>

                  <div className="text-xs font-extrabold text-orange-500 mt-1 flex justify-between items-center">
                    <span>최종 요금</span>
                    <span>₩{Number(item.totalPrice).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* 내역 부재 시 */
          <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
            <span className="text-3xl animate-bounce">📭</span>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-zinc-300">아직 신청하신 예약이 없습니다</h3>
              <p className="text-[10px] text-zinc-500">지도에서 원하는 오피스를 찾아 대여를 개시해 보세요!</p>
            </div>
            <Link
              href="/"
              className="btn-primary px-6 py-3.5 rounded-xl text-xs font-bold shadow-lg"
            >
              오피스 책상 둘러보기 ➔
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
