# 컨벤션 문서

골라주개 프론트엔드의 코드·아키텍처·협업 규칙이다. 팀원과 AI 에이전트가 같은 기준으로 작업하기 위한 문서이며, `AGENTS.md`가 요약이고 이 폴더가 상세다.

| 문서 | 다루는 것 |
|---|---|
| [code-convention](code-convention.md) | 네이밍·파일명·훅·Query Key |
| [srp-convention](srp-convention.md) | FSD 안에서의 단일 책임·슬라이스/세그먼트 구조 |
| [design-convention](design-convention.md) | 토큰·cn·모바일 우선·shadcn·아이콘 |
| [app-message-convention](app-message-convention.md) | APP_MESSAGE / FORM_MESSAGE 사용자 문구 (**도입 예정**) |
| [validation-convention](validation-convention.md) | 검증 순서·실패 보고 |
| [git-convention](git-convention.md) | 커밋·브랜치·PR |

레이어별 역할과 의존 방향은 각 레이어의 `src/<layer>/README.md`를 함께 본다.

## 이 프로젝트의 전제

컨벤션을 읽을 때 아래 전제를 기억한다. 다른 프로젝트에서 쓰던 규칙을 그대로 옮기면 어긋나는 지점들이다.

| 항목 | 이 프로젝트 |
|---|---|
| 렌더링 | **SSR**. Next.js 16 App Router를 그대로 쓴다. Static Export가 아니다 |
| 백엔드 | **Spring Boot REST API** (별도 저장소). 프론트에서 DB에 직접 접근하지 않는다 |
| 데이터 접근 | 서버 컴포넌트 fetch 또는 TanStack Query. BaaS 클라이언트를 쓰지 않는다 |
| 배포 대상 | 웹 브라우저 우선. **WebView 앱 확장 가능성을 열어두고** 설계한다 |
| 폴더 구조 | FSD. 단 `pages` 레이어는 Next와 충돌해 `views`로 부른다 |

## 확정 대기 중인 것

아래는 아직 정해지지 않았다. 임의로 정하지 말고 담당 파트의 확정을 기다린다.

- **디자인 토큰** — 디자인팀 Design Tokens 명세 전달 후 (`design-convention` 참고)
- **한글 본문 폰트** — 디자인팀 확정 후
- **API 계약** — 백엔드 Swagger 명세 공유 후
- **앱 메시지 체계** — Error 핸들러와 Toast 도입 시점에 (`app-message-convention` 참고)
