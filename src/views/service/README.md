# service

서비스 안내. 서비스 이용약관과 개인정보 처리방침으로 가는 입구다.

- **라우트**: `/mypage/service` — `src/app/mypage/service/page.tsx`
- **조립**: `shared/ui/page-header`, `shared/ui/list-row`
- **상태**: 없음
- **참고**: 시안이 아직 없다(#209). 기능정의서(마이페이지 ver0.5 "서비스 안내")의 두 버튼을 고객지원(mypa_071) 입구 줄과 같은 모양으로 둔다(#502). 기능정의서에는 "마케팅 정보 수신 약관 조회"도 있지만 설명이 이용약관과 섞여 있고 IA에 화면이 없어 이번에는 두지 않았다

| 파일 | 설명 |
| --- | --- |
| `ui/service-view.tsx` | 두 줄 입구 |
| `ui/service-view.test.tsx` | 두 입구가 각 문서로 이어지는지 |
| `index.ts` | 공개 API |
