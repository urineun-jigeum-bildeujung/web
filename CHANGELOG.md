# 변경 이력

이 프로젝트에서 무엇이 언제 달라졌는지 기록합니다. **날짜 단위로 쌓고, 각 항목에 이슈 번호를 답니다.**

- 이 문서는 **시간축**을 다룹니다. 프로젝트가 지금 어떤 상태인지는 [README](./README.md)를 봅니다.
- 릴리스 시점에는 해당 날짜 위에 버전 제목(`## v0.1.0`)을 얹습니다.

작성 규칙은 [git-convention](./docs/conventions/git-convention.md)의 "변경 이력 기록" 절을 봅니다.

---

## 2026-08-14

### 개발 환경

- Figma 파일에 새로 올라오거나 바뀐 프레임을 감지해 알리는 `/figma-watch` 커맨드 — 스냅샷 비교 방식이고 `/loop`로 감싸면 주기적으로 확인한다 (#6)
- Figma 프레임을 구현으로 잇는 `/from-figma` 커맨드 — 디자인 분석과 FSD 배치 계획을 승인 게이트로 확인받은 뒤에만 이슈·구현으로 진행하고, `/figma-watch`가 새 프레임을 감지하면 이 분석·게이트까지 자동으로 이어진다 (#11)

## 2026-08-13

### 추가

- 초기 세팅 안내 홈 화면과 다크 모드 데모 토글
- TanStack Query Provider 배선 (`shared/providers`)

### 변경

- 홈 화면을 create-next-app 템플릿에서 서비스 소개 자리 표시 화면으로 교체

### 제거

- PR 동작 확인용으로 넣었던 임시 주석 (#1)

### 개발 환경

- 프론트엔드 스택 설치 — Next.js 16, React 19, Tailwind v4, shadcn/ui, TanStack Query, Zustand, react-hook-form, zod, date-fns, Recharts
- Feature-Sliced Design 폴더 구조와 레이어·슬라이스별 README
- 컨벤션 문서 7종 (`docs/conventions`)
- Prettier·LF 줄바꿈·에디터 공용 설정
- ESLint 컨벤션 강제 — FSD 레이어 경계, Tailwind 클래스, 파일·폴더 네이밍, import 위치
- 테스트 환경 — Vitest 단위 테스트, Playwright E2E
- GitHub Actions CI — typecheck·format·lint·test·build·E2E
- husky 로컬 훅 — pre-commit 린트·포맷, commit-msg 형식 검사, pre-push 이력 보호
- GitHub 이슈·PR 템플릿, CodeRabbit 리뷰 설정
- Claude Code 하네스 (`.claude`) — 슬래시 커맨드 5종, code-reviewer 에이전트, 알림 훅
- 작업 기록 자동화 — PR 제목으로 라벨 부착, 라벨 기반 릴리스 노트 분류, 커밋에서 변경 이력 문장 생성 (#3)
- `main`·`dev` 브랜치 보호 Ruleset — PR 필수, CI 통과 필수, rebase 전용, 이력 되감기 차단
- 원격에 올릴 때 변경 이력 반영과 미응답 리뷰를 확인하는 훅 — PR 생성과 그 이후의 push를 모두 보므로 리뷰 대응 커밋도 기록에서 빠지지 않는다 (#4)
- 변경 이력을 날짜 단위로 바꾸면서 남아 있던 `[Unreleased]` 참조 정정 (#4)
