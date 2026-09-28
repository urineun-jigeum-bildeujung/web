# service-privacy

개인정보 처리방침 전문. 회원가입 약관 동의(sign_001)의 보기에서도 들어온다.

- **라우트**: `/mypage/service/privacy` — `src/app/mypage/service/privacy/page.tsx`
- **조립**: `shared/ui/page-header`, `shared/ui/policy-document`
- **상태**: 없음
- **참고**: 시안이 아직 없다(#209). 기능정의서(마이페이지 ver0.5 "개인 정보 처리 방침 조회")가 적은 시행일·수집·이용 목적·수집 항목·보유 기간을 **교육 프로젝트 시연용 예시**로 채웠다(#502). 수집 항목은 서비스가 실제로 받는 값(내 정보·아이 정보·배송지·주문)에 맞춘다 — 받는 값이 늘면 여기도 고친다

| 파일 | 설명 |
| --- | --- |
| `ui/service-privacy-view.tsx` | 방침 문서 화면 |
| `ui/service-privacy-view.test.tsx` | 기능정의서의 네 가지가 빠지지 않았는지 |
| `config/privacy-sections.ts` | 시행일과 예시 본문 |
| `index.ts` | 공개 API |
