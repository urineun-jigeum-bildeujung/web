# Git 컨벤션

`AGENTS.md`의 Git 절이 요약이고, 이 문서가 상세다.

## 작업 흐름 (이슈 주도)

**모든 작업은 이슈에서 시작한다.**

1. **작업 시작 = 이슈 생성.** 유형·라벨·마일스톤을 달고, 이슈 템플릿 형식(무엇/왜/완료조건)으로 쓴다. (`/start-task`)
2. `dev`에서 기능 브랜치를 판다.
3. 작업 → 논리 단위로 커밋.
4. **PR 올리기 전에** 이슈를 업데이트하고(진행/완료 코멘트), **README.md가 여전히 사실인지 확인**한다. 그 뒤 PR을 만든다. PR은 `.github/PULL_REQUEST_TEMPLATE.md` 형식을 채우고 `Closes #N`으로 이슈를 닫는다. (`/pr`)

**README는 프로젝트 소개 문서다.** 작업 목록이나 진행 상황을 적지 않는다. 그건 GitHub 이슈와 프로젝트 보드가 할 일이다. 작업이 끝났을 때 README에서 볼 것은 "이 변경으로 소개가 사실과 달라졌는가"뿐이다.

| 이번 작업에서 바뀐 것 | 함께 갱신할 곳 |
|---|---|
| npm 스크립트 추가·변경 | 스크립트 표 |
| 의존성 추가·제거 | 기술 스택 표 (`AGENTS.md`의 표도 함께) |
| 폴더 구조 변경 | 폴더 구조 블록 |
| 사용자에게 보이는 기능 | 서비스 소개 문단 |
| 실행 방법·환경 변수 | 시작하기 절 |

해당 없으면 README를 건드리지 않는다.

이슈·PR 둘 다 **템플릿을 반드시 지킨다.** 검증(`/verify`, [validation-convention](validation-convention.md))이 통과하지 않은 채로 PR을 올리지 않는다.

괄호 안은 Claude Code 슬래시 커맨드다. `.claude/commands/`에 있고 이 문서의 흐름을 그대로 실행한다.

## 커밋

- 커밋 메시지는 **한글**.
- 형식: `유형(#이슈번호): 내용` — 예: `feat(#12): 구독 상세 화면 추가`.
- 하나의 논리적 변화가 끝나면 즉시 커밋한다.
- **푸시는 사용자가 명시적으로 요청·허락할 때만** 한다.

### 유형

`feat`(기능) · `fix`(버그) · `refactor` · `style`(간단 CSS) · `test` · `chore`(설정·문서·잡무) · `docs` · `design`.

### 로컬 훅 (husky)

`npm install` 시 husky가 Git 훅을 설치한다. 우회(`--no-verify`)하지 않는다.

- **pre-commit** — 스테이징된 파일에 `eslint --fix`와 `prettier --write`를 돌린다(lint-staged). lint 에러가 있으면 커밋이 막힌다.
- **commit-msg** — 메시지가 `유형(#이슈번호): 내용` 형식(이슈 없으면 `유형: 내용`)인지 검사한다. Merge·Revert 커밋은 통과한다.

push는 막지 않는다. 작업 중인 브랜치에는 아직 조립되지 않은 슬라이스가 정상적으로 존재하므로, 미사용 코드 검사는 병합 시점(CI)에서 한다.

### CI

`.github/workflows/ci.yml`이 `dev`·`main` 대상 PR과 push에서 돈다.

- **verify** — typecheck → format:check → lint → knip → 단위 테스트 → build
- **e2e** — verify 통과 후 Playwright 실행. 실패 시 리포트를 아티팩트로 올린다

배포 파이프라인은 인프라팀이 별도로 관리한다. 이 워크플로우는 코드 품질만 본다.

### 저자 표기

**커밋 저자는 로그인된 Git 계정 하나로만 남긴다.**

- 커밋 메시지에 작성자 이름을 덧붙이지 않는다. 누가 썼는지는 Git 저자 정보로 충분하다.
- **AI 에이전트가 작성한 커밋도 동일하다.** `Co-Authored-By`, `Generated with`, `🤖` 같은 AI 표기 트레일러나 서명을 넣지 않는다. `.claude/settings.json`의 `attribution`이 커밋·PR 양쪽에서 이 표기를 빈 문자열로 막는다.
- 사람이 쓴 커밋과 AI가 쓴 커밋을 구분하지 않는다. 저장소 히스토리에는 **계정 주인이 커밋한 것으로만** 남는다.
- `git commit --author`로 저자를 바꾸지 않는다. 로컬 `user.name` / `user.email`을 그대로 쓴다.

## 브랜치

**브랜치 모델**은 `main` = 릴리스, `dev` = 기본·통합 브랜치다. 기능은 `dev`에서 분기해 PR로 `dev`에 병합하고, 배포 시점에 `dev` → `main`으로 올린다.

- 이름: `유형/도메인/#이슈번호-설명` — 예: `feat/subscription/#12-detail-view`.
- 도메인 하위 기능은 `유형/도메인/기능/#이슈번호` — 예: `feat/market/filter/#47`.

## PR

`.github/PULL_REQUEST_TEMPLATE.md`를 쓴다. 요점은 아래와 같다.

- 작업 내용은 사용자 관점으로 쓴다.
- 백엔드 API 계약 변경에 의존하는 작업이면 어떤 엔드포인트에 의존하는지 함께 적는다.
- 테스트 결과(`npm run typecheck`, `npm run build` 등)를 명시하고, 확인 못 한 항목은 사유를 적는다.
- 연관 이슈는 마지막에 `Closes #이슈번호`.

### 머지

**rebase 머지만 사용한다.** repo 설정에서 squash·merge commit을 비활성화한다. 기능 브랜치는 CI 통과 후 `dev`로 rebase 머지하고 브랜치를 삭제한다. 히스토리를 선형으로 유지한다.

## 줄바꿈

저장소의 모든 텍스트 파일은 **LF**다. `.gitattributes`가 `eol=lf`로 강제하므로 팀원의 `core.autocrlf` 설정과 무관하게 동일하게 유지된다. CRLF로 바뀐 diff가 보이면 설정 문제이니 파일을 고치지 말고 원인을 확인한다.
