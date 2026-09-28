# support-notices

서비스 공지 목록.

- **라우트**: `/mypage/support/notices` — `src/app/mypage/support/notices/page.tsx`
- **조립**: `shared/ui/page-header`, `shared/ui/accordion`
- **상태**: 없음. 공지 API가 없어(2026-09-29 백엔드 확인) 예시 공지다
- **참고**: 시안이 아직 없고(#209) 기능정의서 ver0.5에도 항목이 없다(IA에만 있다). 공지 상세를 따로 둘지 정해지지 않아 고객지원의 많이 찾는 질문처럼 제목을 눌러 그 자리에서 펼친다. 최신 공지가 위로 온다(#502)

| 파일 | 설명 |
| --- | --- |
| `ui/support-notices-view.tsx` | 공지 목록 |
| `ui/support-notices-view.test.tsx` | 최신순과 펼침 |
| `config/notices.ts` | 예시 공지 |
| `index.ts` | 공개 API |
