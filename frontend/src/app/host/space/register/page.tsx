"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/utils/api";

export default function SpaceRegister() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 다중 이미지 업로드 상태
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // 입력 폼 상태 관리
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    capacity: 1,
    address: "",
    addressSummary: "",
    latitude: 37.5665, // 서울 시청 기준 기본 좌표
    longitude: 126.9780,
    priceDaily: 0,
    priceWeekly: 0,
    priceMonthly: 0,
    isInstantBook: false,
    amenities: [] as string[],
  });

  // 로그인 상태 체크 (비인증 사용자는 메인으로 차단)
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("로그인이 필요한 서비스입니다.");
      router.replace("/");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else if (type === "number") {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 편의시설 다중 선택 핸들러
  const handleAmenityChange = (amenity: string) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      if (exists) {
        return { ...prev, amenities: prev.amenities.filter(a => a !== amenity) };
      } else {
        return { ...prev, amenities: [...prev.amenities, amenity] };
      }
    });
  };

  // 이미지 파일 선택 제어
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // 최대 10장 한도 제어
      if (selectedFiles.length + filesArray.length > 10) {
        alert("사진은 최대 10장까지만 업로드할 수 있습니다.");
        return;
      }

      setSelectedFiles((prev) => [...prev, ...filesArray]);
      const urls = filesArray.map(file => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...urls]);
    }
  };

  const removeFile = (index: number) => {
    // 메모리 누수 방지용 ObjectURL 파괴
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      let uploadedUrls: string[] = [];

      // 1. 선택된 로컬 사진이 있는 경우 백엔드 파일 업로드 API 선행 수행
      if (selectedFiles.length > 0) {
        const formDataObj = new FormData();
        selectedFiles.forEach((file) => {
          formDataObj.append("files", file);
        });

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1";
        const token = localStorage.getItem("access_token");

        const uploadRes = await fetch(`${backendUrl}/spaces/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataObj,
        });

        if (!uploadRes.ok) {
          const errBody = await uploadRes.json().catch(() => ({}));
          throw new Error(errBody.message || "사진 업로드 중 서버 에러가 발생했습니다.");
        }

        const uploadData = await uploadRes.json();
        uploadedUrls = uploadData.urls || [];
      }

      // 2. 획득한 이미지 URL 목록을 payload.images 에 주입하여 공간 생성 최종 요청
      const payload = {
        ...formData,
        addressSummary: formData.addressSummary || formData.address.split(" ").slice(1, 3).join(" ") || "서울시",
        images: uploadedUrls,
      };

      await fetchApi("/spaces", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert("공간이 성공적으로 등록되었습니다!");
      router.push("/");
    } catch (err: any) {
      setError(err.message || "공간 등록 중 예외가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 px-6 py-8 text-white">
      {/* 상단 헤더 */}
      <header className="flex justify-between items-center mb-6">
        <button
          onClick={() => {
            if (step > 1) prevStep();
            else router.back();
          }}
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← 뒤로
        </button>
        <div className="text-sm font-semibold text-orange-500">
          공간 등록 ({step}/4 단계)
        </div>
      </header>

      {/* 본문 등록 폼 */}
      <main className="flex flex-col flex-1 justify-between">
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">오피스의 기본 정보를<br />입력해 주세요.</h2>
              <p className="text-xs text-zinc-400">프리랜서가 알아보기 쉽게 작성해 주세요.</p>
            </div>
            
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs text-zinc-400">공간명 (최대 200자)</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="예: 홍대입구역 도보 3분 모던 듀얼모니터석"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3.5 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* 오피스 사진 다중 업로드 드롭존 */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400 font-medium">오피스 사진 등록 (최대 10장)</label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {/* 썸네일 미리보기 리스트 */}
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
                    <img src={url} alt="미리보기" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] font-bold hover:bg-black transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* 사진 파일 추가 버튼 */}
                {previewUrls.length < 10 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 hover:bg-zinc-800 hover:border-orange-500/40 flex flex-col items-center justify-center gap-1 cursor-pointer transition">
                    <span className="text-lg">📸</span>
                    <span className="text-[9px] text-zinc-400 font-bold">사진 추가</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400">상세 설명</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="테이블의 넓이, 소음 정도, 주변 편의시설 등 상세한 정보를 적어 주세요."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400">수용 인원 (책상 수)</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min={1}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">제공 가능한 편의 시설을<br />선택해 주세요.</h2>
              <p className="text-xs text-zinc-400">다중 선택이 가능합니다.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { type: "wifi", label: "🌐 고속 와이파이" },
                { type: "parking", label: "🚗 주차 가능" },
                { type: "phone_ok", label: "📞 전화통화 가능" },
                { type: "video_call_ok", label: "💻 화상회의 가능" },
                { type: "printer", label: "🖨️ 복합기 사용" },
                { type: "kitchen", label: "☕ 주방 및 다과" },
                { type: "locker", label: "🔑 개인 사물함" },
                { type: "24hours", label: "🔓 24시간 운영" },
              ].map(item => {
                const selected = formData.amenities.includes(item.type);
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleAmenityChange(item.type)}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold border text-left transition ${
                      selected
                        ? "bg-orange-500/10 border-orange-500 text-orange-500"
                        : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">오피스 위치(주소)를<br />등록해 주세요.</h2>
              <p className="text-xs text-zinc-400">구체적인 주소지는 예약 확정 고객에게만 공개됩니다.</p>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <label className="text-xs text-zinc-400">도로명/지번 주소</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="예: 서울특별시 마포구 와우산로 21길 36"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400">주소 요약 (공개 범위, 예: 마포구 서교동)</label>
              <input
                type="text"
                name="addressSummary"
                value={formData.addressSummary}
                onChange={handleChange}
                placeholder="미입력 시 주소에서 구·동이 자동 파싱됩니다."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">이용 요금 및 승인 방식 설정을<br />완료해 주세요.</h2>
              <p className="text-xs text-zinc-400">대여 단위를 고려해 원화 금액을 설정해 주세요.</p>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <label className="text-xs text-zinc-400">일 대여 요금 (원)</label>
              <input
                type="number"
                name="priceDaily"
                value={formData.priceDaily || ""}
                onChange={handleChange}
                placeholder="0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400">주 대여 요금 (원 / 미설정 시 입력 생략)</label>
              <input
                type="number"
                name="priceWeekly"
                value={formData.priceWeekly || ""}
                onChange={handleChange}
                placeholder="0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400">월 대여 요금 (원 / 미설정 시 입력 생략)</label>
              <input
                type="number"
                name="priceMonthly"
                value={formData.priceMonthly || ""}
                onChange={handleChange}
                placeholder="0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl glass mt-2">
              <div>
                <div className="text-xs font-bold">즉시 예약 승인</div>
                <div className="text-[10px] text-zinc-400 mt-1">Host 승인 절차 없이 예약 시 자동 수락됩니다.</div>
              </div>
              <input
                type="checkbox"
                name="isInstantBook"
                checked={formData.isInstantBook}
                onChange={handleChange}
                className="w-5 h-5 accent-orange-500 cursor-pointer"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 font-medium text-center mt-2">
                ⚠️ {error}
              </div>
            )}
          </div>
        )}

        {/* 하단 제어 버튼 */}
        <div className="mt-12">
          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={
                (step === 1 && (!formData.title || !formData.description)) ||
                (step === 3 && !formData.address)
              }
              className="w-full btn-primary py-4 text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음 단계로
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !formData.priceDaily}
              className="w-full btn-primary py-4 text-sm font-semibold rounded-xl disabled:opacity-40"
            >
              {loading ? "공간 등록 중..." : "등록 완료하기 🎉"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
