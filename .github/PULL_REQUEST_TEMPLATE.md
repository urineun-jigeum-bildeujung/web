## 요약

<!-- 무엇을 왜 바꿨는지 한두 줄. -->

## 관련 이슈

Closes #

## 변경 유형

- [ ] feat (기능)
- [ ] fix (버그)
- [ ] refactor / style / docs / test / chore
- [ ] design

## 스크린샷 (UI 변경 시)

<!-- before / after. 모바일 기준 화면을 우선으로. -->

## 백엔드 의존

<!-- 의존하는 API 엔드포인트가 있으면 적는다. 없으면 "없음". -->

## 체크리스트

- [ ] `CHANGELOG.md`의 오늘 날짜 절에 이번 작업 기록 (기록할 가치가 없으면 사유 명시)
- [ ] PR 제목이 `유형(#이슈번호): 내용` 형식 (라벨과 릴리스 노트 분류가 여기서 자동으로 결정된다)
- [ ] `npm run typecheck` 통과
- [ ] `npm run test` 통과
- [ ] 새 순수 함수·훅 로직에 colocated 테스트 동반 (해당 없으면 사유 명시)
- [ ] `npm run build` 통과 (또는 단순 UI/CSS 조정이라 생략 — 사유 명시)
- [ ] FSD 의존 방향 준수 (상위 → 하위 단방향, 같은 레이어 간 참조 없음)
- [ ] 서버/클라이언트 컴포넌트 경계 확인 (`use client`를 필요한 최하위에만 부착)
- [ ] HEX 하드코딩 없이 시맨틱 토큰 사용 (`bg-primary`, `text-muted-foreground` 등)
- [ ] 터치 UX 준수 (최소 탭 44×44, hover 의존 없음, 색상 단독 정보전달 없음)
- [ ] 이미지는 `next/image` + width·height(또는 fill), 의미 있는 alt
- [ ] 새 소스 파일에 한 줄 역할 주석 (`src/shared/ui/`의 shadcn 생성 파일은 제외)
