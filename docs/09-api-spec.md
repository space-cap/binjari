# 빈자리 API 명세

> Version 0.1 | Last Updated: 2026-07-12
>
> Base URL: `https://api.binjari.kr/v1` (운영) | `http://localhost:3000/v1` (개발)
>
> 인증: `Authorization: Bearer {access_token}`

---

# 공통 응답 형식

```json
// 성공
{
  "success": true,
  "data": { ... }
}

// 실패
{
  "success": false,
  "error": {
    "code": "SPACE_NOT_FOUND",
    "message": "공간을 찾을 수 없습니다."
  }
}
```

---

# 1. 인증 (Auth)

| Method | Endpoint | 인증 | 설명 |
|---|---|:---:|---|
| POST | `/auth/kakao` | ❌ | 카카오 소셜 로그인 |
| POST | `/auth/google` | ❌ | 구글 소셜 로그인 |
| POST | `/auth/refresh` | ❌ | Access Token 갱신 |
| DELETE | `/auth/logout` | ✅ | 로그아웃 (Refresh Token 무효화) |

### POST /auth/kakao
```json
// Request
{ "kakao_access_token": "string" }

// Response
{
  "access_token": "string",
  "refresh_token": "string",
  "user": { "id": "uuid", "name": "string", "role": "guest" }
}
```

### POST /auth/refresh
```json
// Request
{ "refresh_token": "string" }

// Response
{ "access_token": "string" }
```

---

# 2. 사용자 (Users)

| Method | Endpoint | 인증 | 설명 |
|---|---|:---:|---|
| GET | `/users/me` | ✅ | 내 프로필 조회 |
| PATCH | `/users/me` | ✅ | 내 프로필 수정 |
| POST | `/users/me/business` | ✅ | 사업자 인증 등록 |
| GET | `/users/me/business` | ✅ | 사업자 인증 정보 조회 |

### PATCH /users/me
```json
// Request
{ "name": "string", "phone": "string", "profile_image": "string" }
```

### POST /users/me/business
```json
// Request
{
  "business_number": "123-45-67890",
  "business_name": "주식회사 예시",
  "representative": "홍길동"
}

// Response
{ "verified": true, "verified_at": "2026-07-12T10:00:00Z" }
```

---

# 3. 공간 (Spaces)

| Method | Endpoint | 인증 | 설명 |
|---|---|:---:|---|
| POST | `/spaces` | ✅ Host | 공간 등록 |
| GET | `/spaces` | ❌ | 공간 목록 검색 |
| GET | `/spaces/map` | ❌ | 지도용 공간 마커 목록 |
| GET | `/spaces/:id` | ❌ | 공간 상세 조회 |
| PATCH | `/spaces/:id` | ✅ Host(본인) | 공간 수정 |
| DELETE | `/spaces/:id` | ✅ Host(본인) | 공간 삭제 |
| POST | `/spaces/:id/images` | ✅ Host(본인) | 이미지 업로드 |
| DELETE | `/spaces/:id/images/:imageId` | ✅ Host(본인) | 이미지 삭제 |
| GET | `/spaces/mine` | ✅ Host | 내 공간 목록 |

### POST /spaces
```json
// Request
{
  "title": "강남 IT 스타트업 책상 공유",
  "description": "조용한 환경, 빠른 인터넷",
  "address": "서울시 강남구 테헤란로 123",
  "address_summary": "강남구 역삼동",
  "latitude": 37.5000,
  "longitude": 127.0000,
  "capacity": 2,
  "price_daily": 15000,
  "price_weekly": 80000,
  "price_monthly": 250000,
  "amenities": ["wifi", "phone_ok", "printer"],
  "is_instant_book": false
}
```

### GET /spaces (검색)
```
Query Parameters:
  lat         float    현재 위도
  lng         float    현재 경도
  radius      int      검색 반경 (km, default: 5)
  start_date  date     이용 시작일 (YYYY-MM-DD)
  end_date    date     이용 종료일
  unit        string   daily | weekly | monthly
  min_price   int      최소 가격
  max_price   int      최대 가격
  amenities   string[] 시설 필터 (wifi,phone_ok...)
  page        int      페이지 (default: 1)
  limit       int      개수 (default: 20)
  sort        string   distance | price_asc | price_desc | rating
```

### GET /spaces/map
```
Query Parameters: lat, lng, radius (동일)

Response: [{ id, lat, lng, price_daily, avg_rating }]  // 경량 응답
```

---

# 4. 예약 (Bookings)

| Method | Endpoint | 인증 | 설명 |
|---|---|:---:|---|
| POST | `/bookings` | ✅ Guest | 예약 요청 |
| GET | `/bookings` | ✅ | 내 예약 목록 (Guest: 요청한, Host: 받은) |
| GET | `/bookings/:id` | ✅ | 예약 상세 |
| PATCH | `/bookings/:id/confirm` | ✅ Host | 예약 수락 |
| PATCH | `/bookings/:id/reject` | ✅ Host | 예약 거절 |
| PATCH | `/bookings/:id/cancel` | ✅ | 예약 취소 |

### POST /bookings
```json
// Request
{
  "space_id": "uuid",
  "start_date": "2026-08-01",
  "end_date": "2026-08-31",
  "unit": "monthly",
  "guest_message": "조용히 개발 작업만 합니다."
}

// Response: { booking_id, status: "pending", total_price }
```

### GET /bookings
```
Query Parameters:
  role    string   guest | host
  status  string   pending | confirmed | cancelled | completed
  page    int
  limit   int
```

---

# 5. 결제 (Payments)

| Method | Endpoint | 인증 | 설명 |
|---|---|:---:|---|
| POST | `/payments` | ✅ Guest | 결제 승인 요청 |
| GET | `/payments/:bookingId` | ✅ | 결제 정보 조회 |
| POST | `/payments/webhook` | ❌ (토스 서명 검증) | 토스 결제 웹훅 |

### POST /payments
```json
// Request (토스페이먼츠 결제 완료 후 프론트에서 호출)
{
  "booking_id": "uuid",
  "payment_key": "토스_결제_키",
  "order_id": "토스_주문_ID",
  "amount": 250000
}
```

---

# 6. 리뷰 (Reviews)

| Method | Endpoint | 인증 | 설명 |
|---|---|:---:|---|
| POST | `/reviews` | ✅ Guest | 리뷰 작성 |
| GET | `/spaces/:id/reviews` | ❌ | 공간 리뷰 목록 |
| POST | `/reviews/:id/reply` | ✅ Host | 리뷰 답변 |

### POST /reviews
```json
// Request
{
  "booking_id": "uuid",
  "rating": 5,
  "content": "조용하고 인터넷도 빠릅니다. 강추!"
}
```

---

# 7. 알림 (Notifications)

| Method | Endpoint | 인증 | 설명 |
|---|---|:---:|---|
| GET | `/notifications` | ✅ | 알림 목록 |
| PATCH | `/notifications/:id/read` | ✅ | 알림 읽음 처리 |
| PATCH | `/notifications/read-all` | ✅ | 전체 읽음 처리 |
| POST | `/notifications/fcm-token` | ✅ | FCM 토큰 등록 |

---

# 8. 정산 (Settlements)

| Method | Endpoint | 인증 | 설명 |
|---|---|:---:|---|
| GET | `/settlements` | ✅ Host | 정산 내역 조회 |
| POST | `/settlements/account` | ✅ Host | 정산 계좌 등록 |
| GET | `/settlements/account` | ✅ Host | 정산 계좌 조회 |

---

# 9. 관리자 (Admin)

| Method | Endpoint | 인증 | 설명 |
|---|---|:---:|---|
| GET | `/admin/spaces/pending` | ✅ Admin | 승인 대기 공간 목록 |
| PATCH | `/admin/spaces/:id/approve` | ✅ Admin | 공간 승인 |
| PATCH | `/admin/spaces/:id/reject` | ✅ Admin | 공간 거절 |
| GET | `/admin/users` | ✅ Admin | 전체 사용자 목록 |
| POST | `/admin/settlements/process` | ✅ Admin | 정산 수동 처리 |

---

# 에러 코드

| 코드 | HTTP | 설명 |
|---|:---:|---|
| UNAUTHORIZED | 401 | 인증 필요 |
| FORBIDDEN | 403 | 권한 없음 |
| USER_NOT_FOUND | 404 | 사용자 없음 |
| SPACE_NOT_FOUND | 404 | 공간 없음 |
| BOOKING_NOT_FOUND | 404 | 예약 없음 |
| SPACE_NOT_AVAILABLE | 409 | 해당 기간 예약 불가 |
| BUSINESS_ALREADY_VERIFIED | 409 | 이미 인증된 사업자 |
| PAYMENT_AMOUNT_MISMATCH | 400 | 결제 금액 불일치 |
| INVALID_DATE_RANGE | 400 | 날짜 범위 오류 |
| RATE_LIMIT_EXCEEDED | 429 | 요청 한도 초과 |
