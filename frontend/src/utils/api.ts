/**
 * 빈자리 백엔드 API 서버를 안전하고 쉽게 호출하기 위한 공통 Fetch 래퍼 함수
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1";
  
  // 슬래시('/') 유무 보정
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${backendUrl}${cleanEndpoint}`;

  // 로컬 스토리지에서 JWT 토큰 가져오기
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // 기본 헤더 및 옵션 병합
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, mergedOptions);

  // 401 Unauthorized 발생 시 로그인 세션 만료 처리 및 홈(로그인 화면) 리다이렉트
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.message || `API 요청에 실패했습니다. (상태 코드: ${response.status})`);
  }

  // 응답 데이터 JSON 파싱
  return response.json().catch(() => null);
}
