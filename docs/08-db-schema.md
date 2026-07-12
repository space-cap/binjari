# 빈자리 DB 스키마

> Version 0.1 | Last Updated: 2026-07-12
>
> DB: PostgreSQL | ORM: TypeORM (NestJS)

---

# ERD 개요

```
users
  ├── user_businesses (1:1)
  ├── spaces          (1:N) — Host로서
  ├── bookings        (1:N) — Guest로서
  ├── reviews         (1:N)
  ├── notifications   (1:N)
  └── settlements     (1:N)

spaces
  ├── space_images      (1:N)
  ├── space_amenities   (1:N)
  ├── space_availabilities (1:N)
  └── bookings          (1:N)

bookings
  ├── payments  (1:1)
  └── reviews   (1:1)
```

---

# 테이블 정의

## users

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | 사용자 고유 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 |
| name | VARCHAR(100) | NOT NULL | 이름 |
| phone | VARCHAR(20) | NULLABLE | 휴대폰 번호 |
| profile_image | VARCHAR(500) | NULLABLE | 프로필 이미지 URL |
| role | ENUM('guest','host','both') | DEFAULT 'guest' | 역할 |
| kakao_id | VARCHAR(100) | UNIQUE, NULLABLE | 카카오 소셜 ID |
| google_id | VARCHAR(100) | UNIQUE, NULLABLE | 구글 소셜 ID |
| is_active | BOOLEAN | DEFAULT true | 활성 여부 |
| created_at | TIMESTAMP | DEFAULT NOW() | 가입일 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 수정일 |

---

## user_businesses

> Host 전용 사업자 인증 정보

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK(users.id), UNIQUE | 사용자 |
| business_number | VARCHAR(20) | NOT NULL | 사업자등록번호 |
| business_name | VARCHAR(200) | NOT NULL | 상호명 |
| representative | VARCHAR(100) | NOT NULL | 대표자명 |
| verified_at | TIMESTAMP | NULLABLE | 인증 완료 시각 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

## spaces

> 등록된 공간 (책상/자리)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| host_id | UUID | FK(users.id) | Host 사용자 |
| title | VARCHAR(200) | NOT NULL | 공간명 |
| description | TEXT | NOT NULL | 상세 설명 |
| address | VARCHAR(500) | NOT NULL | 전체 주소 (예약 후 공개) |
| address_summary | VARCHAR(200) | NOT NULL | 공개 주소 (구·동 단위) |
| latitude | DECIMAL(10,7) | NOT NULL | 위도 |
| longitude | DECIMAL(10,7) | NOT NULL | 경도 |
| capacity | INTEGER | DEFAULT 1 | 수용 인원 (책상 수) |
| price_daily | INTEGER | NULLABLE | 일 단위 가격 (원) |
| price_weekly | INTEGER | NULLABLE | 주 단위 가격 (원) |
| price_monthly | INTEGER | NULLABLE | 월 단위 가격 (원) |
| status | ENUM('pending','active','inactive','rejected') | DEFAULT 'pending' | 승인 상태 |
| is_instant_book | BOOLEAN | DEFAULT false | 즉시 예약 가능 여부 |
| avg_rating | DECIMAL(3,2) | DEFAULT 0.00 | 평균 평점 (집계) |
| review_count | INTEGER | DEFAULT 0 | 리뷰 수 (집계) |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

---

## space_images

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| space_id | UUID | FK(spaces.id) | 공간 |
| url | VARCHAR(500) | NOT NULL | 이미지 URL |
| is_primary | BOOLEAN | DEFAULT false | 대표 이미지 여부 |
| sort_order | INTEGER | DEFAULT 0 | 정렬 순서 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

## space_amenities

> 공간 시설/규칙 (다중 값)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| space_id | UUID | FK(spaces.id) | 공간 |
| amenity | ENUM | NOT NULL | 시설 종류 |

**amenity ENUM 값:**
```
wifi          — 고속 인터넷
parking       — 주차 가능
phone_ok      — 전화 통화 가능
video_call_ok — 화상회의 가능
printer       — 복합기 사용 가능
kitchen       — 주방/냉장고
locker        — 개인 사물함
24hours       — 24시간 이용
```

---

## space_availabilities

> 공간 가용 일정 (Host가 설정)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| space_id | UUID | FK(spaces.id) | 공간 |
| date | DATE | NOT NULL | 날짜 |
| is_available | BOOLEAN | DEFAULT true | 이용 가능 여부 |

*UNIQUE(space_id, date)*

---

## bookings

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| space_id | UUID | FK(spaces.id) | 공간 |
| guest_id | UUID | FK(users.id) | Guest 사용자 |
| start_date | DATE | NOT NULL | 이용 시작일 |
| end_date | DATE | NOT NULL | 이용 종료일 |
| unit | ENUM('daily','weekly','monthly') | NOT NULL | 예약 단위 |
| total_price | INTEGER | NOT NULL | 총 금액 (원) |
| guest_message | TEXT | NULLABLE | Guest 요청 메시지 |
| status | ENUM | DEFAULT 'pending' | 예약 상태 |
| confirmed_at | TIMESTAMP | NULLABLE | 수락 시각 |
| cancelled_at | TIMESTAMP | NULLABLE | 취소 시각 |
| cancel_reason | TEXT | NULLABLE | 취소 사유 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**status ENUM 값:**
```
pending    — 수락 대기
confirmed  — 확정
cancelled  — 취소
completed  — 이용 완료
```

---

## payments

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| booking_id | UUID | FK(bookings.id), UNIQUE | 예약 |
| amount | INTEGER | NOT NULL | 결제 금액 (원) |
| status | ENUM | DEFAULT 'pending' | 결제 상태 |
| payment_method | VARCHAR(50) | NULLABLE | 결제 수단 (card/kakaopay) |
| toss_payment_key | VARCHAR(200) | NULLABLE | 토스 결제 키 |
| toss_order_id | VARCHAR(200) | NULLABLE | 토스 주문 ID |
| refund_amount | INTEGER | DEFAULT 0 | 환불 금액 |
| refunded_at | TIMESTAMP | NULLABLE | 환불 처리 시각 |
| paid_at | TIMESTAMP | NULLABLE | 결제 완료 시각 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**status ENUM 값:**
```
pending   — 결제 대기
completed — 결제 완료
refunded  — 환불 완료
failed    — 결제 실패
```

---

## reviews

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| booking_id | UUID | FK(bookings.id), UNIQUE | 예약 (1예약 1리뷰) |
| space_id | UUID | FK(spaces.id) | 공간 |
| guest_id | UUID | FK(users.id) | 작성자 |
| rating | INTEGER | CHECK(1~5) | 별점 |
| content | TEXT | NOT NULL | 리뷰 내용 |
| host_reply | TEXT | NULLABLE | 호스트 답변 |
| host_replied_at | TIMESTAMP | NULLABLE | 답변 시각 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

## notifications

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK(users.id) | 수신자 |
| type | ENUM | NOT NULL | 알림 종류 |
| title | VARCHAR(200) | NOT NULL | 제목 |
| body | TEXT | NOT NULL | 내용 |
| data | JSONB | NULLABLE | 부가 데이터 (booking_id 등) |
| is_read | BOOLEAN | DEFAULT false | 읽음 여부 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**type ENUM 값:**
```
booking_requested  — 예약 요청 (Host 수신)
booking_confirmed  — 예약 확정 (Guest 수신)
booking_cancelled  — 예약 취소
review_requested   — 리뷰 작성 요청 (Guest 수신)
settlement_done    — 정산 완료 (Host 수신)
```

---

## refresh_tokens

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK(users.id) | |
| token | VARCHAR(500) | UNIQUE | Refresh Token 해시 |
| expires_at | TIMESTAMP | NOT NULL | 만료 시각 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

## settlements

> Host 정산 내역

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| host_id | UUID | FK(users.id) | Host |
| amount | INTEGER | NOT NULL | 정산 금액 (원) |
| status | ENUM('pending','completed') | DEFAULT 'pending' | |
| bank_name | VARCHAR(50) | NULLABLE | 은행명 |
| account_number | VARCHAR(50) | NULLABLE | 계좌번호 |
| settled_at | TIMESTAMP | NULLABLE | 입금 완료 시각 |
| period_start | DATE | NOT NULL | 정산 기간 시작 |
| period_end | DATE | NOT NULL | 정산 기간 종료 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

# 인덱스

```sql
-- 공간 검색 성능
CREATE INDEX idx_spaces_lat_lng ON spaces(latitude, longitude);
CREATE INDEX idx_spaces_status ON spaces(status);
CREATE INDEX idx_spaces_host_id ON spaces(host_id);

-- 예약 조회
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_space_id ON bookings(space_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- 알림 조회
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);

-- 가용일정 조회
CREATE INDEX idx_space_avail ON space_availabilities(space_id, date, is_available);
```
