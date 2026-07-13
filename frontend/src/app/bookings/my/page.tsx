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
  review?: {
    id: string;
    rating: number;
    comment: string;
  } | null;
}

export default function MyBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 결제 관련 상태
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // 리뷰/평점 관련 상태
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<BookingItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

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

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("로그인이 필요합니다.");
      router.replace("/");
      return;
    }
    loadMyBookings();
  }, [router]);

  // 가상 결제 승인 전송 처리
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      await fetchApi("/payments", {
        method: "POST",
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          paymentMethod: paymentMethod,
        }),
      });

      alert(`🎉 결제가 완료되었습니다!\n[${selectedBooking.space.title}] 예약이 최종 확정되었습니다!`);
      setShowPaymentModal(false);
      await loadMyBookings();
    } catch (err: any) {
      setPaymentError(err.message || "결제 승인 처리 도중 에러가 발생했습니다.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // 평점 후기(리뷰) 등록 요청 처리
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;
    if (!reviewComment.trim()) {
      setReviewError("한 줄 이용 후기를 입력해 주세요.");
      return;
    }

    setReviewLoading(true);
    setReviewError(null);

    try {
      await fetchApi("/reviews", {
        method: "POST",
        body: JSON.stringify({
          bookingId: selectedBookingForReview.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      alert("🎉 소중한 오피스 후기가 성공적으로 등록되었습니다!\n별점 점수 평균에 실시간 누적 반영됩니다.");
      setShowReviewModal(false);
      setReviewComment("");
      setReviewRating(5);
      await loadMyBookings(); // 리로드하여 즉시 후기 완료 상태 변경
    } catch (err: any) {
      setReviewError(err.message || "후기 등록 도중 서버 에러가 발생했습니다.");
    } finally {
      setReviewLoading(false);
    }
  };

  // 예약 취소 비동기 요청 처리
  const handleCancelBooking = async (bookingId: string, spaceTitle: string) => {
    if (
      !window.confirm(
        `정말로 [${spaceTitle}] 예약을 취소하시겠습니까?\n(일일 예약 취소 제한은 최대 5회까지만 허용됩니다.)`,
      )
    ) {
      return;
    }

    try {
      await fetchApi(`/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
      alert("🎉 예약 취소가 완료되었습니다.");
      await loadMyBookings();
    } catch (err: any) {
      alert(err.message || "예약 취소 도중 에러가 발생했습니다.");
    }
  };

  // 취소 가능 여부 판별 헬퍼
  const isCancelable = (checkInDate: string, status: string) => {
    if (status === "cancelled") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(checkInDate);
    return bookingDate >= today;
  };

  // 이미지 절대 주소 보정 헬퍼
  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const backendBase = "http://localhost:4000";
    return `${backendBase}${url}`;
  };

  // 날짜 변환 헬퍼
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  // 상태 배지 컴포넌트 맵핑
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
                className="p-4 rounded-2xl glass border border-zinc-850 flex flex-col gap-3"
              >
                {/* 상단 오피스 요약 정보 레이아웃 */}
                <div className="flex gap-4 items-center">
                  {/* 썸네일 */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 relative">
                    {primaryImg ? (
                      <img
                        src={getImageUrl(primaryImg.url)}
                        alt={item.space.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-zinc-650 bg-zinc-900">
                        BINJARI
                      </div>
                    )}
                  </div>

                  {/* 상세 텍스트 */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {item.space.addressSummary}
                      </span>
                      <div className="flex items-center gap-2">
                        {isCancelable(item.checkInDate, item.status) && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(item.id, item.space.title)}
                            className="text-[10px] text-zinc-500 hover:text-red-400 font-semibold underline transition cursor-pointer"
                          >
                            예약 취소
                          </button>
                        )}
                        {renderStatusBadge(item.status)}
                      </div>
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

                {/* 대기중일 때만 활성화되는 결제하기 버튼 */}
                {item.status === "pending" && (
                  <button
                    onClick={() => {
                      setSelectedBooking(item);
                      setPaymentMethod("card");
                      setPaymentError(null);
                      setShowPaymentModal(true);
                    }}
                    className="w-full border border-orange-500/30 text-orange-500 bg-orange-500/5 hover:bg-orange-500/10 text-[10px] font-bold py-2.5 rounded-xl transition"
                  >
                    결제하고 예약 확정하기 💳
                  </button>
                )}

                {/* 이용 완료된 예약 하단에 별점 평점 등록 기능 노출 */}
                {item.status === "confirmed" && !item.review && (
                  <button
                    onClick={() => {
                      setSelectedBookingForReview(item);
                      setReviewRating(5);
                      setReviewComment("");
                      setReviewError(null);
                      setShowReviewModal(true);
                    }}
                    className="w-full border border-orange-500/30 text-orange-500 bg-orange-500/5 hover:bg-orange-500/10 text-[10px] font-bold py-2.5 rounded-xl transition"
                  >
                    이용 후기 별점 남기기 ⭐
                  </button>
                )}

                {item.status === "confirmed" && item.review && (
                  <div className="w-full text-center py-2.5 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-500 text-[10px] font-bold">
                    후기 작성 완료 ✓ (별점: {item.review.rating}점)
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* 내역 부재 폴백 */
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

      {/* 가상 카드 결제 팝업 모달 오버레이 */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 z-20 bg-black/70 flex items-end justify-center px-4 max-w-[450px] mx-auto">
          <div className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 flex flex-col gap-5 animate-slideUp z-30">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h2 className="text-sm font-bold">대여 요금 가상 결제</h2>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                닫기
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-zinc-850 border border-zinc-800">
                <span className="text-[9px] text-orange-500 font-bold uppercase tracking-wider">
                  {selectedBooking.space.addressSummary}
                </span>
                <h4 className="text-xs font-bold text-white truncate">
                  {selectedBooking.space.title}
                </h4>
                <div className="text-[10px] text-zinc-400 mt-1 flex justify-between">
                  <span>날짜: {formatDate(selectedBooking.checkInDate)}</span>
                  <span>좌석: {selectedBooking.seatCount}석</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 font-bold">결제 수단 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`py-3 rounded-xl text-xs font-bold border transition ${
                      paymentMethod === "card"
                        ? "border-orange-500 bg-orange-500/5 text-orange-500"
                        : "border-zinc-800 bg-zinc-850 text-zinc-400"
                    }`}
                  >
                    💳 신용/체크카드
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("kakao_pay")}
                    className={`py-3 rounded-xl text-xs font-bold border transition ${
                      paymentMethod === "kakao_pay"
                        ? "border-orange-500 bg-orange-500/5 text-orange-500"
                        : "border-zinc-800 bg-zinc-850 text-zinc-400"
                    }`}
                  >
                    💛 카카오페이 (가상)
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 mt-1">
                <span className="text-xs text-zinc-400 font-semibold">총 결제 대금</span>
                <span className="text-md font-extrabold text-orange-500">
                  ₩{Number(selectedBooking.totalPrice).toLocaleString()}
                </span>
              </div>

              {paymentError && (
                <div className="text-[10px] text-red-400 font-semibold text-center">
                  ⚠️ {paymentError}
                </div>
              )}

              <button
                type="submit"
                disabled={paymentLoading}
                className="w-full btn-primary py-4 text-xs font-bold rounded-xl disabled:opacity-40 shadow-lg"
              >
                {paymentLoading ? "결제 승인 중..." : "결제 승인 완료하기 💳"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 이용 후기 및 별점 등록 팝업 모달 오버레이 */}
      {showReviewModal && selectedBookingForReview && (
        <div className="fixed inset-0 z-20 bg-black/70 flex items-end justify-center px-4 max-w-[450px] mx-auto">
          <div className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 flex flex-col gap-5 animate-slideUp z-30">
            {/* 헤더 */}
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h2 className="text-sm font-bold">공간 이용 별점/후기 남기기</h2>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                닫기
              </button>
            </div>

            {/* 입력 폼 */}
            <form onSubmit={handleReviewSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-zinc-850 border border-zinc-800">
                <span className="text-[9px] text-zinc-400 font-medium">대여 완료 오피스</span>
                <h4 className="text-xs font-bold text-white truncate">
                  {selectedBookingForReview.space.title}
                </h4>
              </div>

              {/* 별점 1~5 정수 선택 라디오 */}
              <div className="flex flex-col gap-2 items-center">
                <label className="text-[10px] text-zinc-400 font-bold self-start">공간 만족도 별점</label>
                <div className="flex gap-2.5 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-2xl transition-transform active:scale-125"
                    >
                      {star <= reviewRating ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-orange-500 font-bold">
                  {reviewRating}점 / 5점
                </span>
              </div>

              {/* 이용평 작성 */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 font-bold">한 줄 이용 후기</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="공간의 청결도, 분위기, 통신 상태 등 솔직한 한 줄 후기를 남겨주셔요!"
                  maxLength={100}
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs focus:border-orange-500 focus:outline-none resize-none placeholder-zinc-550"
                  required
                />
              </div>

              {reviewError && (
                <div className="text-[10px] text-red-400 font-semibold text-center">
                  ⚠️ {reviewError}
                </div>
              )}

              {/* 제출 */}
              <button
                type="submit"
                disabled={reviewLoading}
                className="w-full btn-primary py-4 text-xs font-bold rounded-xl disabled:opacity-40 shadow-lg"
              >
                {reviewLoading ? "후기 등록 중..." : "후기 평점 등록 완료 ⭐"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
