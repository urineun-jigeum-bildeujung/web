# order-claim

취소·반품·교환을 신청하는 화면. 유형은 라우트가 아니라 `type` 쿼리로 구분한다.

- **라우트**: `/mypage/orders/[orderId]/claim` — `src/app/mypage/orders/[orderId]/claim/page.tsx`
- **조립**: `shared/ui`의 `page-header` · `empty-state` · `button` · `icon`
- **상태**: URL 쿼리 `type` (`cancel` · `return` · `exchange`)

## 아직 접수까지 가지 못한다

기능명세서의 `MYPA_261`에는 유형 드롭다운 · 사유 라디오(단순변심 · 상품 하자/불량 · 배송 지연 · 기타) · 사진 최대 3장 · 상세 300자 · 신청하기가 있다. **그 프레임이 Figma에 없다** — 2026-09-21에 파일 전체를 검색해 `사유`·`단순변심`이 0건인 것을 확인했고, 2026-09-18 PD팀 답도 "우선순위 낮음"이었다.

백엔드 `POST /orders/{orderId}/claims`는 열려 있어 **화면만 오면 붙는다.** `claimType`(`CANCEL`·`RETURN`·`EXCHANGE`) · `reason`(자유 문자열, 최대 1000자, 선택) · `items[]`(필수) · `imageUrls[]`를 받는다.

**빈 자리로 두지 않는다.** 주문 상세의 반품·교환 확인창이 이 화면으로 데려오므로, 왜 지금은 안 되는지 알리고 주문 상세로 돌아갈 길을 남긴다. 배송 조회가 택배사 연동 전에 쓴 방식과 같다 (#288).

## 취소는 이 화면을 거치지 않는다

기능정의서와 유즈케이스는 취소도 "유형=취소"로 이 화면에 오게 적어 두었지만, **시안(`mypa_061`)과 IA는 목록의 취소 모달에서 끝낸다.** 백엔드도 시안 기준으로 보고 `POST /orders/{orderId}/cancel`에 요청 본문을 두지 않았다(2026-09-21 회신). `ClaimType.CANCEL`이 enum에 있지만 쓰지 않는다.

`type=cancel`로 들어오는 경로는 남겨 두었다 — PD 확인 결과에 따라 살아날 수 있어서다.
