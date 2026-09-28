# support-inquiries

1:1 문의 내역과 서비스 문의하기.

- **라우트**: `/mypage/support/inquiries` — `src/app/mypage/support/inquiries/page.tsx`
- **조립**: `shared/ui/page-header`, `shared/ui/accordion`, `shared/ui/badge`, `shared/ui/bottom-action-bar`, `shared/ui/preparing-dialog`
- **상태**: 준비 중 안내를 띄울지(`useState`). 문의 API가 없어 서버 상태는 없다
- **참고**: 시안이 아직 없다(#209). 기능정의서(마이페이지 ver0.5)를 따른다(#502)
  - 내역은 최신순이고 답변 대기·답변 완료를 보인다. **문의 API가 없어(2026-09-29 백엔드 확인) 예시 내역이고, 목록 위에 예시라고 밝힌다** — 쓰지 않은 문의를 제 내역으로 오해하지 않게(#503 리뷰)
  - 서비스 문의하기는 기능정의서대로면 노션 문의 페이지로 가는데 **그 주소가 아직 없어** 준비 중 안내를 띄운다. 주소가 오면 안내 대신 그 페이지를 연다
  - 주문 상세·상품 상세에서 들어올 때 주문 정보를 붙여 넘기는 것은 기능정의서가 MVP에서 뺐다

| 파일 | 설명 |
| --- | --- |
| `ui/support-inquiries-view.tsx` | 문의 내역과 서비스 문의하기 |
| `ui/support-inquiries-view.test.tsx` | 최신순·상태·답변 표시·준비 중 안내 |
| `config/inquiries.ts` | 예시 문의 내역 |
| `index.ts` | 공개 API |
