# views 레이어

FSD 표준의 **pages 레이어**다. 라우트 하나에 대응하는 화면을 조립한다.

> **이름이 `views`인 이유** — Next.js는 `src/pages/`를 Pages Router로 인식해 App Router와 충돌한다. 그래서 FSD 표준 이름을 쓸 수 없다. 되돌리지 않는다.

## 담는 것

- 라우트 1:1 화면 컴포넌트. `widgets`·`features`·`entities`를 배치해 한 화면을 완성한다.
- 그 화면에서만 쓰는 레이아웃 구성.

## 담지 않는 것

- 재사용되는 UI 블록 → `widgets`
- 사용자 행동 단위 로직 → `features`
- 도메인 모델 → `entities`

## 의존 방향

`widgets` · `features` · `entities` · `shared`를 import할 수 있다. `app`은 import하지 않는다.

`app/**/page.tsx`가 이 레이어의 컴포넌트를 불러 쓴다.

## 구조

```
views/
└── subscription-detail/
    ├── ui/
    ├── index.ts
    └── README.md
```

바깥에서는 `index.ts`가 노출한 것만 import한다.

## 페이지 README (필수)

**페이지를 만들면 그 슬라이스에 `README.md`를 함께 만든다.** 라우트(`app/**/page.tsx`)를 추가할 때 대응하는 views 슬라이스에 아래 템플릿으로 작성한다.

```markdown
# <슬라이스명>

<이 화면이 무엇을 하는지 한두 문장.>

- **라우트**: <URL 경로> — <app 라우트 파일 경로>
- **조립**: <사용하는 widgets/features/entities 슬라이스>
- **상태**: <서버 상태·클라이언트 상태 요약. 없으면 "없음">
- **참고**: <설계 결정, 엣지 케이스 등. 없으면 생략>
```

예시는 [home/README.md](./home/README.md)를 본다.

## 현재 슬라이스

| 슬라이스 | 라우트 | 설명 |
| --- | --- | --- |
| `home` | `/` | 메인. 전체 탭은 큐레이션, 종류 탭은 상품 목록 |
| `dev-gallery` | `/dev` | 공용 컴포넌트 확인용 개발 화면. 프로덕션에서는 열리지 않는다 |
| `dev-screens` | `/dev/screens` | 만들어 둔 화면 목록. 프로덕션에서는 열리지 않는다 |
| `onboarding` | `/onboarding` | 반려동물 프로필 등록 6단계. 최초 서비스 소개와의 관계는 확인 필요 |
| `mypage` | `/mypage` | 마이페이지 홈 |
| `my-info` | `/mypage/info` | 내 정보와 배송지 목록 |
| `edit-nickname` | `/mypage/info/nickname` | 닉네임 변경 |
| `verify-phone` | `/mypage/info/phone` | 휴대폰 번호 인증 |
| `edit-address` | `/mypage/address/new` | 배송지 추가·수정 |
| `search-address` | `/mypage/address/search` | 주소 검색 |
| `restock-alarm` | `/mypage/restock` | 재입고 알림 목록·선택 모드 |
| `recently-viewed` | `/mypage/recently-viewed` | 최근 본 상품 목록 (자리 표시) |
| `my-reviews` | `/mypage/reviews` | 나의 상품 후기 (탭) |
| `payment-methods` | `/mypage/payment` | 간편결제 카드 관리 |
| `orders` | `/mypage/orders` | 주문·배송 확인 |
| `order-detail` | `/mypage/orders/[orderId]` | 주문 상세 |
| `support` | `/mypage/support` | 고객지원 · FAQ |
| `settings` | `/mypage/settings` | 설정 |
| `pet-profile` | `/mypage/pets` | 반려동물 정보와 제품 관리 (탭) |
| `edit-pet` | `/mypage/pets/{basic,body,health}` | 아이 정보 항목별 수정 |
| `add-pet` | `/mypage/pets/new` | 새 아이 등록 도입 |
| `product-compare` | `/compare` | 상품 비교 |
| `select-compare-product` | `/compare/select` | 비교할 상품 고르기 |
| `cart` | `/cart` | 장바구니. 옵션 변경·삭제 확인을 포함한다 |
| `checkout` | `/payment`, `/payment/{address,done}` | 결제하기·배송지 설정·주문 완료 |
| `mypage-notifications` | `/mypage/notifications` | 알림 목록 (자리 표시) |
| `addresses` | `/mypage/address` | 배송지 관리 목록 (자리 표시) |
| `order-claim` | `/mypage/orders/[orderId]/claim` | 취소·반품·교환 접수 (자리 표시) |
| `review-write` | `/mypage/reviews/write` | 리뷰 작성 (자리 표시) |
| `review-detail` | `/mypage/reviews/[reviewId]` | 리뷰 상세 (자리 표시) |
| `support-inquiries` | `/mypage/support/inquiries` | 1:1 문의 내역 (자리 표시) |
| `support-notices` | `/mypage/support/notices` | 공지사항 (자리 표시) |
| `service` | `/mypage/service` | 서비스 안내 (자리 표시) |
| `service-terms` | `/mypage/service/terms` | 서비스 이용약관 (자리 표시) |
| `service-privacy` | `/mypage/service/privacy` | 개인정보 처리방침 (자리 표시) |
| `deals` | `/deals` | 타임딜 목록 (자리 표시) |
| `search` | `/search` | 검색 결과 (자리 표시) |
| `recommendations` | `/recommendations` | 맞춤 추천 목록 (자리 표시) |
| `login` | `/login` | 로그인 진입 (자리 표시) |
| `signup` | `/signup` | 회원가입 (자리 표시) |
| `likes` | `/likes` | 좋아요(찜) 목록 (자리 표시) |
| `product-detail` | `/products/[productId]` | 상품 상세 (자리 표시) |
| `product-reviews` | `/products/[productId]/reviews` | 상품 리뷰 목록 (자리 표시) |
