# order-claim

취소·반품·교환을 접수하는 화면. 유형은 라우트가 아니라 `type` 쿼리로 구분한다.

- **라우트**: `/mypage/orders/[orderId]/claim` — `src/app/mypage/orders/[orderId]/claim/page.tsx`
- **조립**: `shared/ui/page-header`
- **상태**: URL 쿼리 `type` (`cancel` · `return` · `exchange`)
- **참고**: 디자인 확정 전 자리 표시 화면
