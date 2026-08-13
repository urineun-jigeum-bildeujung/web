# Git 컨벤션

`AGENTS.md`의 Git 절이 요약이고, 이 문서가 상세다.

## 작업 흐름 (이슈 주도)

**모든 작업은 이슈에서 시작한다.**

1. **작업 시작 = 이슈 생성.** 유형·라벨·마일스톤을 달고, 이슈 템플릿 형식(무엇/왜/완료조건)으로 쓴다. (`/start-task`)
2. `dev`에서 기능 브랜치를 판다.
3. 작업 → 논리 단위로 커밋.
4. **PR 올리기 전에** 이슈를 업데이트하고(진행/완료 코멘트), **README.md의 "진행 상황" 섹션을 이번 작업에 맞게 갱신**한다(완료 항목 반영, 다음 작업 갱신). 그 뒤 PR을 만든다. PR은 `.github/PULL_REQUEST_TEMPLATE.md` 형식을 채우고 `Closes #N`으로 이슈를 닫는다. (`/pr`)

이슈·PR 둘 다 **템플릿을 반드시 지킨다.** 검증(`/verify`, [validation-convention](validation-convention.md))이 통과하지 않은 채로 PR을 올리지 않는다.

괄호 안은 Claude Code 슬래시 커맨드다. `.claude/commands/`에 있고 이 문서의 흐름을 그대로 실행한다.

## 커밋

- 커밋 메시지는 **한글**.
- 형식: `유형(#이슈번호): 내용` — 예: `feat(#12): 구독 상세 화면 추가`.
- 하나의 논리적 변화가 끝나면 즉시 커밋한다.
- **푸시는 사용자가 명시적으로 요청·허락할 때만** 한다.

### 유형

`feat`(기능) · `fix`(버그) · `refactor` · `style`(간단 CSS) · `test` · `chore`(설정·문서·잡무) · `docs` · `design`.

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
