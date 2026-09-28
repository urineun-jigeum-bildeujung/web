# service-terms

서비스 이용약관 전문. 회원가입 약관 동의(sign_001)의 보기에서도 들어온다.

- **라우트**: `/mypage/service/terms` — `src/app/mypage/service/terms/page.tsx`
- **조립**: `shared/ui/page-header`, `shared/ui/policy-document`
- **상태**: 없음
- **참고**: 시안이 아직 없다(#209). 기능정의서(마이페이지 ver0.5 "서비스 이용약관 조회")가 적은 시행일·목차·전문을 **교육 프로젝트 시연용 예시 조항**으로 채웠고, 부칙에 예시라는 것을 밝힌다(#502). 취소·반품·교환 기간처럼 서비스가 실제로 지키는 규칙은 주문 화면의 동작과 맞춘다

| 파일 | 설명 |
| --- | --- |
| `ui/service-terms-view.tsx` | 약관 문서 화면 |
| `ui/service-terms-view.test.tsx` | 시행일·목차·예시 문장 |
| `config/terms-sections.ts` | 시행일과 예시 조항 |
| `index.ts` | 공개 API |
