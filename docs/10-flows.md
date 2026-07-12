# 빈자리 핵심 플로우

> Version 0.1 | Last Updated: 2026-07-12

---

# Flow 1. 인증 플로우 (카카오 OAuth)

```
[웹] 카카오 로그인 버튼 클릭
  │
  ▼
[카카오] 카카오 로그인 화면 표시
  │  사용자 로그인 완료
  ▼
[카카오] kakao_access_token 발급 → 웹 브라우저로 전달
  │
  ▼
[웹] POST /auth/kakao { kakao_access_token }
  │
  ▼
[서버] 카카오 API로 사용자 정보 조회
  │   (이름, 이메일, kakao_id)
  │
  ├─ 신규 사용자 → DB에 users 레코드 생성
  └─ 기존 사용자 → users 조회
  │
  ▼
[서버] JWT 생성
  │   Access Token  (만료: 1시간)
  │   Refresh Token (만료: 30일) → DB refresh_tokens 저장
  │
  ▼
[웹] access_token + refresh_token 저장
  │   (Access Token: LocalStorage 또는 메모리 상태 관리)
  │   (Refresh Token: Secure Cookie - HttpOnly, SameSite=Lax 설정 권장)
  │
  ▼
[웹] 홈 화면(지도)으로 이동

---

[Access Token 만료 시]
[웹] API 요청 → 401 응답 수신
  │
  ▼
[웹] POST /auth/refresh { refresh_token }
  │
  ├─ 유효한 경우 → 새 access_token 발급
  └─ 만료된 경우 → 로그인/랜딩 페이지로 이동
```

---

# Flow 2. 예약 + 결제 플로우

```
[Guest] 공간 검색 → 상세 페이지
  │
  ▼
[Guest] 날짜 선택 + 메시지 입력 + "예약 요청" 버튼
  │
  ▼
[웹] POST /bookings
  │   { space_id, start_date, end_date, unit, guest_message }
  │
  ▼
[서버] 유효성 검사
  │   ① 해당 기간 이미 예약된 공간인지 확인
  │   ② Guest 본인 인증 여부 확인
  │
  ├─ 실패 → 오류 응답 (SPACE_NOT_AVAILABLE)
  └─ 성공 → booking 생성 (status: pending)
  │
  ▼
[서버] Host에게 알림 발송
  │   (브라우저 Web Push 및 휴대폰 문자/알림톡 발송)
  │   "새 예약 요청이 들어왔습니다: 링크 연결"
  │
  ▼
[Host 웹] 예약 요청 수신 (알림톡 링크 클릭 진입) → 수락/거절 선택
  │
  ├─ 거절 → PATCH /bookings/:id/reject
  │    └─ booking status: cancelled
  │    └─ Guest에게 거절 문자/알림 발송
  │
  └─ 수락 → PATCH /bookings/:id/confirm
       │
       ▼
      [서버] booking status: confirmed
       │
       ▼
      [Guest 웹] 예약 확정 알림 수신 (알림톡/문자)
       │
       ▼
      [Guest] 결제 화면 이동 → 결제 수단 선택
       │
       ▼
      [토스페이먼츠] 웹 결제창 표시 → 사용자 결제 완료
       │   토스 SDK가 payment_key + order_id 반환
       │
       ▼
      [웹] POST /payments
       │   { booking_id, payment_key, order_id, amount }
       │
       ▼
      [서버] 토스 API로 결제 최종 승인 요청
       │   금액 검증 (조작 방지)
       │
       ├─ 실패 → payment status: failed → Guest에게 웹 내 오류 화면 렌더링
       └─ 성공 → payment status: completed
            │
            ▼
           [서버] 입실 안내 문자(SMS/알림톡) 자동 발송
            │   "예약이 확정됐습니다. 입실 상세: https://binjari.kr/bookings/{id}"
            │
            ▼
           [웹] 예약 완료 페이지 표시

---

[이용 완료 후]
[서버] 스케줄러: end_date + 1일 → booking status: completed
  │
  ▼
[서버] Guest에게 리뷰 작성 요청 알림
  │
  ▼
[Guest] 리뷰 작성 (별점 + 내용)
  │
  ▼
[서버] spaces.avg_rating, review_count 재집계

---

[월 정산]
[서버] 매월 1일 스케줄러 실행
  │   전월 completed 예약의 payment 합산
  │
  ▼
[서버] settlements 레코드 생성
  │
  ▼
[운영팀] 정산 계좌로 수동 입금 (MVP 단계)
  │
  ▼
[서버] settlement status: completed → Host 알림 발송
```

---

# Flow 3. 파일 업로드 플로우 (환경별 분기)

```
[Host] 공간 등록 중 사진 선택 (최대 10장)
  │
  ▼
[웹] 이미지 클라이언트 사이드 압축 (Web Worker 또는 Canvas 리사이즈)
  │
  ▼
[웹] POST /spaces/:id/images (multipart/form-data)
  │
  ▼
[서버] 파일 유효성 검사
  │   ① 확장자 확인: jpg, jpeg, png, webp만 허용
  │   ② 파일 크기: 최대 10MB
  │   ③ MIME 타입 확인 (확장자 스푸핑 방지)
  │
  ├─ 실패 → 오류 응답
  └─ 성공 → 환경변수 STORAGE_TYPE 확인
       │
       ├─ STORAGE_TYPE=local
       │    │
       │    ▼
       │   [서버] /uploads/{space_id}/{uuid}.webp 로 저장
       │    │
       │    ▼
       │   [서버] URL: http://localhost:3000/uploads/{path}
       │
       └─ STORAGE_TYPE=oci
            │
            ▼
           [서버] OCI Object Storage SDK로 업로드
            │   Bucket: binjari-spaces
            │   Key: spaces/{space_id}/{uuid}.webp
            │
            ▼
           [OCI] 파일 저장 완료
            │
            ▼
           [서버] URL: https://objectstorage.ap-seoul-1.oraclecloud.com/...
  │
  ▼
[서버] space_images 테이블에 URL 저장
  │
  ▼
[웹] 업로드된 이미지 미리보기 목록 업데이트 및 표시

---

[이미지 서빙 — 운영 환경 최적화]

OCI Object Storage
  └─ Public 읽기 허용 설정
  └─ CDN 연동 (OCI CDN or Cloudflare) — 선택사항
  └─ URL 직접 접근으로 서버 부하 없음
```

---

# 부록: 알림 발송 플로우

```
[서버 이벤트 발생]
  (예약 요청, 수락, 취소, 리뷰 요청, 정산 완료 등)
  │
  ▼
[서버] notifications 테이블에 레코드 저장
  │
  ├─ Web Push 구독 정보 존재 시 → Web Push 프로토콜을 사용해 브라우저 알림 전송
  │                                [웹] 브라우저 알림 팝업 수신
  │
  └─ 알리고 API 연동 → 비즈니스 성격에 따라 등록된 휴대폰 번호로 알림톡/SMS 발송
                         (예: "예약 요청이 접수되었습니다. 수락 대기 중입니다.")
  │
  ▼
[웹] 웹 내부 알림함 데이터 최신화 (다음 페이지 새로고침 or 웹소켓 연결 시 즉시 확인 가능)
```
