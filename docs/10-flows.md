# 빈자리 핵심 플로우

> Version 0.1 | Last Updated: 2026-07-12

---

# Flow 1. 인증 플로우 (카카오 OAuth)

```
[앱] 카카오 로그인 버튼 클릭
  │
  ▼
[카카오] 카카오 로그인 화면 표시
  │  사용자 로그인 완료
  ▼
[카카오] kakao_access_token 발급 → 앱으로 전달
  │
  ▼
[앱] POST /auth/kakao { kakao_access_token }
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
[앱] access_token + refresh_token 로컬 저장
  │   (SecureStore — iOS Keychain / Android Keystore)
  │
  ▼
[앱] 홈 화면으로 이동

---

[Access Token 만료 시]
[앱] API 요청 → 401 응답 수신
  │
  ▼
[앱] POST /auth/refresh { refresh_token }
  │
  ├─ 유효한 경우 → 새 access_token 발급
  └─ 만료된 경우 → 로그인 화면으로 이동
```

---

# Flow 2. 예약 + 결제 플로우

```
[Guest] 공간 검색 → 상세 화면
  │
  ▼
[Guest] 날짜 선택 + 메시지 입력 + "예약 요청" 버튼
  │
  ▼
[앱] POST /bookings
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
[서버] Host에게 푸시 알림 발송
  │   "새 예약 요청이 들어왔습니다"
  │
  ▼
[Host 앱] 예약 요청 수신 → 수락/거절 선택
  │
  ├─ 거절 → PATCH /bookings/:id/reject
  │    └─ booking status: cancelled
  │    └─ Guest에게 거절 알림 발송
  │
  └─ 수락 → PATCH /bookings/:id/confirm
       │
       ▼
      [서버] booking status: confirmed
       │
       ▼
      [Guest 앱] 예약 확정 알림 수신
       │
       ▼
      [Guest] 결제 화면 이동 → 결제 수단 선택
       │
       ▼
      [토스페이먼츠] 결제창 표시 → 사용자 결제 완료
       │   토스가 payment_key + order_id 반환
       │
       ▼
      [앱] POST /payments
       │   { booking_id, payment_key, order_id, amount }
       │
       ▼
      [서버] 토스 API로 결제 최종 승인 요청
       │   금액 검증 (조작 방지)
       │
       ├─ 실패 → payment status: failed → Guest에게 오류 알림
       └─ 성공 → payment status: completed
            │
            ▼
           [서버] 입실 안내 문자 자동 발송 (SMS)
            │   "예약이 확정됐습니다. 입실 방법: ..."
            │
            ▼
           [앱] 예약 완료 화면 표시

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
[앱] 이미지 압축 처리 (최대 1MB로 리사이즈)
  │
  ▼
[앱] POST /spaces/:id/images (multipart/form-data)
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
[앱] 업로드된 이미지 미리보기 표시

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
  ▼
[서버] 수신자의 FCM 토큰 조회
  │
  ├─ 토큰 있음 → Firebase FCM으로 푸시 발송
  │               [앱] 푸시 알림 수신 + 배지 업데이트
  │
  └─ 토큰 없음 → 앱 내 알림함에만 저장
                  (다음 접속 시 확인 가능)
```
