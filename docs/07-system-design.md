# 빈자리 시스템 설계 개요

> Version 0.1 | Last Updated: 2026-07-12
>
> 상세 내용은 각 문서 참고: [DB 스키마](./08-db-schema.md) | [API 명세](./09-api-spec.md) | [핵심 플로우](./10-flows.md)

---

# 1. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│                                                          │
│   [React Native App]          [Next.js Web]             │
│   iOS / Android               (SEO, 랜딩페이지)          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────▼──────────────────────────────────┐
│                      API Server                          │
│                                                          │
│              NestJS (Node.js + TypeScript)               │
│                                                          │
│  [Auth]  [Space]  [Booking]  [Payment]  [Notification]  │
└────┬──────────┬──────────────────┬───────────────────────┘
     │          │                  │
┌────▼──┐  ┌───▼────┐       ┌─────▼──────┐
│  DB   │  │ File   │       │ External   │
│       │  │Storage │       │ Services   │
│Postgres│  │        │       │            │
│       │  │ 개발:  │       │ 카카오 OAuth│
│       │  │ Local  │       │ 토스페이먼츠│
│       │  │        │       │ Firebase   │
│       │  │ 운영:  │       │ FCM        │
│       │  │  OCI   │       │ 카카오맵   │
│       │  │Object  │       │ 국세청 API │
│       │  │Storage │       │ 알리고(SMS)│
└───────┘  └────────┘       └────────────┘
```

---

# 2. 환경 구성

| 항목 | 개발 (local) | 운영 (production) |
|---|---|---|
| 서버 | localhost | OCI Compute (VM.Standard.E2.1.Micro — 무료) |
| DB | localhost PostgreSQL | OCI Autonomous DB 또는 PostgreSQL on Compute |
| 파일 저장 | `/uploads` 로컬 폴더 | OCI Object Storage |
| 환경 변수 | `.env.local` | OCI Vault 또는 환경변수 직접 설정 |
| 배포 | `npm run start:dev` | Docker + PM2 |

---

# 3. 주요 기술 결정 (ADR)

## ADR-01. 모바일 프레임워크: React Native

- iOS / Android 동시 개발 → 인력 효율
- 웹뷰 없이 네이티브 성능
- 지도(카카오맵 SDK) 연동 가능

## ADR-02. 백엔드: NestJS

- TypeScript 기반 → 타입 공유 (DTO 재사용)
- 모듈 구조 → 팀 확장 시 분리 쉬움
- 빠른 개발 속도

## ADR-03. 파일 저장: 환경변수 분기

```
STORAGE_TYPE=local   → 로컬 디스크 저장
STORAGE_TYPE=oci     → OCI Object Storage (S3 호환 API)
```

코드 변경 없이 환경만 전환 가능

## ADR-04. 지도: 카카오맵 API

- 국내 주소 정확도 최고
- React Native SDK 지원
- 좌표 → 주소 변환 (역지오코딩) 무료

## ADR-05. 결제: 토스페이먼츠

- 국내 PG 중 개발자 경험(DX) 최고
- 웹훅 기반 결제 상태 동기화
- 카드 + 카카오페이 통합 지원

## ADR-06. 인증: 카카오 OAuth (우선)

- 국내 사용자 카카오 계정 보유율 높음
- 추후 구글 추가

---

# 4. 보안 원칙

| 항목 | 방식 |
|---|---|
| 인증 | JWT (Access 1시간 + Refresh 30일) |
| 비밀번호 | 소셜 로그인만 사용 (자체 비밀번호 없음) |
| 공간 주소 | 예약 확정 전 상세 주소 숨김 (구·동 단위만 공개) |
| 파일 업로드 | 이미지 확장자·용량 검증 (jpg/png/webp, 최대 10MB) |
| API | Rate limiting (분당 60회) |
| HTTPS | 전 구간 HTTPS 필수 |
