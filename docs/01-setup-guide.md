# 빈자리(Binjari) 로컬 개발 환경 셋팅 가이드 (Local Setup Guide)

> 로컬 개발 및 테스트 시 필요한 외부 API 연동 설정(카카오 로그인, 카카오 지도 SDK) 가이드라인입니다.

---

## 🔑 1. 카카오 API 연동 설정 (Kakao Developers)

카카오 디벨로퍼스([Kakao Developers](https://developers.kakao.com/)) 콘솔에서 아래 설정들이 누락 없이 반영되어야 로컬 화면이 정상 동작합니다.

### 📍 Web 플랫폼 도메인 등록 (필수 - 카카오맵 미출력 에러 방지)
카카오맵 웹 SDK는 등록된 도메인이 아닌 곳에서 요청을 보내면 지도 타일 다운로드를 전면 차단합니다. (지도가 안 뜨는 검은색/회색 버그 유발)
* **메뉴 경로:** `내 애플리케이션` ➔ `앱 설정` ➔ `플랫폼` ➔ **[Web]**
* **사이트 도메인 등록 값:**
  - `http://localhost:3000` (반드시 기입)

### 🔑 카카오 로그인 활성화 및 Redirect URI 등록
* **메뉴 경로 1:** `제품 설정` ➔ `카카오 로그인`
  - 활성화 상태: **`ON`**
* **메뉴 경로 2:** `제품 설정` ➔ `카카오 로그인` ➔ **[Redirect URI]**
  - 등록 값: `http://localhost:3000/auth/callback/kakao`

### 🔒 Client Secret (보안 키) 설정 유연 지원
* **메뉴 경로:** `제품 설정` ➔ `카카오 로그인` ➔ `보안`
* **보안 기능 활성화 시:**
  - `Client Secret 코드` 값을 복사하여 프론트엔드 환경변수 `NEXT_PUBLIC_KAKAO_CLIENT_SECRET`에 필수로 채워주셔야 로그인이 성립됩니다.
* **보안 기능 비활성화 시:**
  - 환경변수에서 키를 생략하셔도 자동으로 로그인 흐름이 바이패스(Bypass)됩니다.

---

## 📂 2. 로컬 환경 변수 (.env) 셋팅 스펙

### 프론트엔드 (`frontend/.env.local`)
```env
# Kakao Web API Keys
NEXT_PUBLIC_KAKAO_REST_API_KEY=your_rest_api_key
NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:3000/auth/callback/kakao
NEXT_PUBLIC_KAKAO_CLIENT_SECRET=your_client_secret_if_enabled
NEXT_PUBLIC_KAKAO_MAP_CLIENT_KEY=your_javascript_sdk_key_for_map

# Backend Endpoint
NEXT_PUBLIC_API_URL=http://localhost:4000/v1
```

### 백엔드 (`backend/.env`)
```env
# Server Port
PORT=4000

# TypeORM Database Configuration (Neon Serverless Postgres)
DB_HOST=ep-young-breeze-aoz29ou7.c-2.ap-southeast-1.aws.neon.tech
DB_PORT=5432
DB_DATABASE=binjaridb
DB_USERNAME=neondb_owner
DB_PASSWORD=your_neon_db_password
DB_SYNCHRONIZE=true
DB_SSL=true

# JWT Secret
JWT_SECRET=your_jwt_signing_key_here
```
