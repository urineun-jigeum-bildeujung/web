# review-write

구매한 상품의 리뷰를 작성한다.

- **라우트**: `/mypage/reviews/write` — `src/app/mypage/reviews/write/page.tsx`
- **조립**: `shared/ui/page-header`
- **상태**: URL 쿼리 `orderItemId`와 리뷰 작성 폼 상태. API 계약 확정 전 미연동
- **참고**: 같은 상품도 구매 건별로 구분해야 하므로 임시로 `orderItemId`를 사용한다. 실제 식별자와 필수값 처리 방식은 API 계약과 함께 확정한다
