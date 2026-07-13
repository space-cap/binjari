# 🌌 빈자리 (Binjari)

> **남는 자리를 연결하다.**
> 
> 기업·사무실의 유휴 업무 공간(남는 책상)을 프리랜서·1인 창업가와 연결하여 가치를 창출하는 온디맨드 공간 공유 중개 플랫폼입니다.

<p align="left">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/KakaoMap-FFCD00?style=flat-square&logo=kakaotalk&logoColor=black" alt="KakaoMap" />
</p>

---

## 📌 프로젝트 소개

재택근무의 정착, 구조조정 등으로 비어 있는 회사 내 유휴 데스크/회의실 공간을 게스트(프리랜서, 1인 개발자)에게 합리적인 비용으로 제공합니다.

- **Host (공간 공급자)**: 미사용 좌석을 공유하여 부가 임대 수익을 창출하고 공실률을 극소화합니다.
- **Guest (공간 이용자)**: 일반 공유오피스 멤버십 대비 저렴한 가격에 조용하고 쾌적한 실제 사무실 환경을 유연하게 이용합니다.

---

## ⚡ 핵심 기능 (MVP 마일스톤)

### 1. 지도 중심의 공간 검색 및 실시간 탐색 (Kakao Map SDK)
- 카카오맵 API 동기화를 통해 서울 성수·성동구 일대 공유 오피스의 핀 마커 및 요약 정보 카드를 모던한 뷰로 시각화합니다.
- 동적 라우팅을 이용해 썸네일 캐러셀, 시설물 안내, 위치 카드를 매끄럽게 연결합니다.

### 2. 가용석 제한 예약 제어 알고리즘
- 동일한 날짜에 선점된 예약 좌석의 총합을 실시간 연산하여, 공급 한도(`capacity`)를 초과하는 예약을 원천 봉쇄(409 Conflict)하는 똑똑한 예약 엔진을 탑재했습니다.

### 3. 가상 카드/카카오페이 결제 연동
- 결제 완료 성공 즉시 예약 상태를 대기(`pending`)에서 확정(`confirmed`)으로 승격하는 가상 결제 트랜잭션을 구현했습니다.

### 4. 안티 어뷰징 예약 취소 시스템
- 사용자의 편리한 예약을 취소하되, 악의적인 반복 선점을 방지하기 위한 **일일 최대 5회 취소 가드** 및 **지난 과거 예약 취소 차단** 필터가 작동합니다.

### 5. 프리미엄 0.5단위 별점 및 한 줄 후기 피드
- 별 아이콘을 좌우 50% 영역으로 분할해 터치하거나 클릭하여 0.5점 단위로 평점을 매길 수 있는 **SVG clipPath 마스킹 별점 모달**을 결합했습니다. (투박한 슬라이더 제거)
- 상세화면 내 평균 평점 통계의 실시간 집계 연산 및 실제 게스트들의 한 줄 후기 피드 목록을 렌더링합니다.

---

## 📂 프로젝트 구조

```
binjari/
├── backend/            # NestJS API 서버
│   ├── src/
│   │   ├── auth/       # JWT 인증 및 Kakao OAuth
│   │   ├── users/      # 회원 정보 도메인
│   │   ├── spaces/     # 오피스 공간 및 이미지 정적 서빙
│   │   ├── bookings/   # 예약 등록/취소 및 가용 가드
│   │   ├── payments/   # 가상 결제 승인
│   │   └── reviews/    # 0.5단위 평점 및 이용 후기 집계
│   └── test/
├── frontend/           # Next.js 웹 프론트엔드 (App Router)
│   ├── src/
│   │   ├── app/        # 맵 뷰(/), 예약판(/bookings/my), 상세(/spaces/[id])
│   │   ├── components/ # 모달 및 캐러셀 공통 모듈
│   │   └── utils/      # API 통신 래퍼
└── docs/               # 기획 명세서 대시보드 및 상세 기획 문서군
```

---

## 🚀 로컬 실행 방법 (Quick Start)

### Prerequisites
- Node.js v18 이상 및 PostgreSQL 데이터베이스(혹은 Neon Cloud DB) 설정 필요

### 1. 백엔드 실행 방법 (Port: 4000)
```bash
cd backend
npm install

# .env 파일 내 DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, JWT_SECRET, KAKAO 설정
npm run start:dev
```

### 2. 프론트엔드 실행 방법 (Port: 3000)
```bash
cd frontend
npm install

# .env.local 파일 내 NEXT_PUBLIC_KAKAO_MAP_CLIENT_KEY 설정
npm run dev
```

---

## 📜 기획 문서 및 시스템 설계 명세
서비스 아키텍처 및 상세한 요구사항 정의는 **[기획 문서 종합 README](./docs/README.md)**를 통해 확인하실 수 있습니다.
