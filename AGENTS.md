# 골라주개 Agent Guide (Karpathy Guidelines)

이 문서는 AI 에이전트가 **골라주개** 프로젝트에서 작업할 때 준수해야 하는 운영 및 행동 지침입니다. Andrej Karpathy의 관찰을 바탕으로 AI 코딩 에이전트가 자주 저지르는 실수를 방지하기 위한 핵심 원칙을 통합하여 작성되었습니다.

**핵심 원칙:** 이 가이드라인은 속도보다 **신중함**과 **정확성**을 우선합니다. 모든 작업은 "시니어 엔지니어의 관점"에서 수행되어야 합니다.

---

## 0. 프로젝트 개요 (Context)

- **서비스명**: 골라주개 — 고민은 줄이고, 우리 애한테 맞게 골라주개
- **한 줄 정의**: 소비량 예측형 스마트 구독 커머스 (반려동물 카테고리)
- **해결하는 문제**: 반려동물은 자신의 상태를 말로 표현할 수 없어, 보호자는 기호성·섭취량·변 상태·체중 변화 같은 간접 신호로 "이 선택이 맞았는가"를 계속 추측해야 합니다. 이 프로젝트는 그 추측을 **근거 있는 판단**으로 바꾸는 것을 목표로 합니다.
- **이 저장소의 범위**: 프론트엔드 단독 저장소입니다. 백엔드는 Spring Boot 기반 REST API로 별도 저장소에서 개발되며, 이 저장소는 그 API를 소비합니다.

이 맥락이 UI 판단에 영향을 줍니다. 추천 결과를 보여줄 때는 "왜 우리 아이에게 추천하는지"에 해당하는 근거를 함께 노출하는 것이 이 서비스의 핵심 가치입니다. 단순 별점·인기순 나열은 이 프로젝트가 명시적으로 차별화하려는 대상입니다.

---

## 1. 참고 문서 (Technical Conventions)

- 사용자의 작업 환경 OS: **Windows**
- 프로젝트 개요 및 실행 방법: [README.md](./README.md)
- Next.js 16 API 확인: `node_modules/next/dist/docs/` (아래 자동 생성 블록 참고)

세부 규칙은 [docs/conventions](./docs/conventions/README.md)가 상세이고 이 문서가 요약입니다. 충돌하면 컨벤션 문서를 따릅니다.

| 문서 | 다루는 것 |
| --- | --- |
| [code-convention](./docs/conventions/code-convention.md) | 네이밍·파일명·훅·Query Key |
| [srp-convention](./docs/conventions/srp-convention.md) | FSD 단일 책임·슬라이스/세그먼트 구조 |
| [design-convention](./docs/conventions/design-convention.md) | 토큰·cn·모바일 우선·shadcn·아이콘 |
| [app-message-convention](./docs/conventions/app-message-convention.md) | 사용자 문구 (**도입 예정, 현재 미적용**) |
| [validation-convention](./docs/conventions/validation-convention.md) | 검증 순서·실패 보고 |
| [git-convention](./docs/conventions/git-convention.md) | 커밋·브랜치·PR |

레이어별 역할과 의존 방향은 각 `src/<layer>/README.md`를 봅니다.

---

## 2. 행동 지침 (Behavioral Guidelines)

### 2.1 코드 작성 전 생각하기 (Think Before Coding)

**가정하지 마십시오. 혼란을 숨기지 마십시오. 트레이드오프를 명시하십시오.**

- 가정을 명확하게 기술하십시오. 불확실하다면 질문하십시오.
- 여러 해석이 가능하다면 마음대로 선택하지 말고 사용자에게 제시하십시오.
- 더 간단한 방법이 있다면 제안하십시오. 필요하다면 지시에 반대 의견을 제시하십시오.
- 불명확한 부분이 있다면 멈추십시오. 혼란스러운 부분을 명시하고 질문하십시오.

### 2.2 단순함 우선 (Simplicity First)

**문제를 해결하는 최소한의 코드만 작성하십시오. 추측에 기반한 구현은 금지합니다.**

- 요청받지 않은 기능은 추가하지 마십시오.
- 단일 용도 코드를 위해 복잡한 추상화를 도입하지 마십시오.
- 요청되지 않은 "유연성"이나 "설정 가능성"을 임의로 확장하지 마십시오.
- 발생 불가능한 시나리오에 대한 과도한 에러 핸들링을 피하십시오.
- 200줄로 짠 코드가 50줄로 가능하다면 다시 작성하십시오.

### 2.3 외과수술식 수정 (Surgical Changes)

**필요한 부분만 건드리십시오. 본인이 만든 코드만 정리하십시오.**

- 인접한 코드, 주석, 포맷을 임의로 "개선"하지 마십시오.
- 고장 나지 않은 것을 리팩토링하지 마십시오.
- 본인의 방식과 다르더라도 기존 스타일을 엄격히 따르십시오.
- 본인의 변경으로 인해 사용되지 않게 된 import, 변수, 함수는 즉시 제거하십시오. (기존의 유휴 코드는 보고만 하십시오.)

### 2.4 목표 중심 실행 (Goal-Driven Execution)

**성공 기준을 정의하고 검증될 때까지 반복하십시오.**

- "검증 추가" → "잘못된 입력에 대한 테스트 작성 후 통과시키기"와 같이 구체적인 목표를 세우십시오.
- 멀티스텝 작업 시 간략한 계획을 제시하십시오: `[단계] → 검증: [확인 방법]`

### 2.5 실재하는 코드 확인 (Workspace Evidence)

**실제 파일을 직접 읽고 확인하십시오. 기억이나 요약에 의존하지 마십시오.**

- 수정 전 반드시 연관 파일을 모두 읽어 최신 상태와 호출 부를 확인하십시오.
- 로컬 코드가 본인의 가정과 다를 경우 코드를 신뢰하고 계획을 수정하십시오.
- 파일 하나만 보고 땜질식으로 수정하지 마십시오. 데이터 조회 지점, 타입 정의, hooks, 호출 컴포넌트, 렌더링 컴포넌트까지 하나의 흐름으로 확인하십시오.
- 서버에서 필터링·정렬·페이지네이션이 가능한 조건은 클라이언트에서 다시 `filter` 하지 말고 API 요청 파라미터로 처리하십시오.
- 타입을 맞추기 위해 `as unknown as` 같은 이중 단언을 사용하지 마십시오. API 응답 타입 정의와 실제 사용 필드를 일치시키십시오.
- API 명세상 nullable이 아닌 값에 불필요한 fallback을 추가하지 마십시오. nullable 여부는 백엔드 API 명세(Swagger)를 먼저 확인하십시오.
- 불필요한 `use client`, 임의 `Map`/`Record` 변환, 중복 display type 등 구조적 냄새가 보이면 구현을 계속하지 말고 먼저 사용자에게 문제와 대안을 보고하십시오.
- 사용자가 좁은 수정을 요청하더라도, 그 수정을 정확히 하기 위해 필요한 연관 코드는 반드시 함께 확인하십시오.

### 2.6 한국어 출력 시 콜론 사용 금지 (No Closing Colons)

**한국어 문장은 반드시 마침표(.), 물음표(?), 느낌표(!)로 끝내십시오.**

- 영어권 LLM의 습관인 문장 끝 콜론(:) 사용을 절대 금지합니다.
- 예: "다음과 같습니다:" (X) → "다음과 같습니다." (O)
- 코드 내부, 키-값 쌍, 레이블 등에서의 콜론 사용은 허용됩니다. 문장 종결용으로만 금지합니다.

### 2.7 한국어 파일 헤더 주석 (File Header Comments)

**새로운 소스 파일을 생성할 때, 첫 번째 줄에 해당 파일의 역할을 설명하는 한 줄 주석을 작성하십시오.**

- 형식: `// 사용자 인증 상태를 관리하는 Context Provider` (TypeScript/JS 기준)
- `use client`, `use server` 바로 아래 또는 파일 맨 위에 위치시킵니다.
- 설정 파일 이외의 모든 소스 파일에 적용합니다.
- `src/shared/ui/` 하위의 shadcn 생성 파일은 예외입니다. CLI가 덮어쓰므로 주석을 넣지 마십시오.

### 2.8 계획 + 체크리스트 + 컨텍스트 노트 (Plan + Checklist + Context Notes)

**비정형적인 작업 시작 전 반드시 세 가지 결과물을 생성하십시오.**

- **Plan**: 무엇을 왜 만드는지 기술.
- **Checklist (`checklist.md`)**: 체크박스 형태의 구체적 작업 목록.
- **Context Notes (`context-notes.md`)**: 작업 중 내린 결정과 그 이유를 기록.
- `checklist.md`와 `context-notes.md`는 에이전트 전용 작업 기록 파일입니다.
- `checklist.md`와 `context-notes.md`는 커밋 대상에 포함하지 말고, 하나의 논리적 변화 커밋이 완료된 후 반드시 삭제하십시오.
- 사용자가 계획만 주고 코딩을 지시하면 멈추고 산출물 생성 여부를 물으십시오.

### 2.9 완료 전 테스트 실행 (Run Tests)

**코드를 수정했다면 "완료"라고 말하기 전에 반드시 테스트를 실행하십시오.**

- `npm run typecheck` → `npm run format:check` → `npm run lint` → `npm run build` 순으로 실행하십시오. 상세는 [validation-convention](./docs/conventions/validation-convention.md)을 따릅니다.
- 테스트 결과(통과/실패/불가능 사유)를 구체적으로 보고하십시오.
- 단, 단일 파일 내부의 단순 문구, 위치, 색상, 여백, className 조정처럼 타입·데이터 흐름·빌드 결과에 영향을 주지 않는 변경은 전체 `npm run build` 또는 `npm run lint`를 생략할 수 있습니다.
- 새 파일 생성, import/export 변경, 타입 변경, hook 로직 변경, API 응답 타입 변경, query key 변경, 라우트 변경, 공용 컴포넌트 변경은 간단해 보여도 `npm run build` 또는 관련 검증을 실행하십시오.
- 검증을 생략한 경우에는 완료 보고에 "단순 UI/CSS 조정이라 빌드와 lint는 생략"처럼 이유를 명시하십시오.
- **명령은 반드시 프로젝트 루트에서 실행하십시오.** `src/` 안에서 `next build`를 실행하면 Next가 `src`를 프로젝트 루트로 오인해 `src/tsconfig.json`, `src/next-env.d.ts`, `src/.next`를 생성하고 경로 별칭이 깨집니다.

### 2.10 의미 있는 커밋 (Semantic Commits)

**하나의 논리적 변화가 완료되면 즉시 커밋하십시오. 사용자의 요청을 기다리지 마십시오.**

- 커밋 메시지 한 줄로 설명 가능한 단위로 쪼개십시오.
- 형식은 `유형(#이슈번호): 내용`이고 한글로 씁니다. 상세는 [git-convention](./docs/conventions/git-convention.md)을 따릅니다.
- **AI가 작성한 커밋에 AI 표기를 남기지 마십시오.** `Co-Authored-By`, `Generated with`, 🤖 같은 트레일러나 서명을 넣지 않습니다. 저자는 로그인된 Git 계정 하나로만 남고, 사람이 쓴 커밋과 구분하지 않습니다. `git commit --author`로 저자를 바꾸지도 않습니다.
- 푸시는 사용자가 명시적으로 요청·허락할 때만 합니다.
- **리뷰를 읽을 때 접힌 `<details>` 블록을 전부 펼치십시오.** CodeRabbit은 nitpick·분석 과정·제안 코드를 접어 두므로 요약만 보면 지적을 놓칩니다. 리뷰 본문을 `head`로 잘라 읽지 마십시오.
- **받은 리뷰에는 반드시 답을 남기십시오.** 고쳤으면 무엇을 어떻게 고쳤는지, 안 고쳤으면 그 근거를 해당 스레드에 씁니다. CodeRabbit 지적도 **현재 코드에 대조한 뒤** 판단하십시오. 봇은 리뷰 시작 시점의 코드를 보므로 이미 고친 것을 다시 지적하기도 합니다. 상세는 [git-convention](./docs/conventions/git-convention.md)의 "리뷰 응답"을 따릅니다.
- **모든 작업은 이슈에서 시작합니다.** 브랜치를 파기 전에 이슈를 만드십시오(`/start-task`). 이슈 없이 브랜치를 만들거나 `#0` 같은 임의 번호를 쓰지 마십시오. 사용자가 좁은 작업을 시켰더라도 PR로 갈 작업이면 이슈가 먼저입니다.
- **PR을 올릴 때 `CHANGELOG.md`의 오늘 날짜 절에 한 줄 기록하십시오.** 커밋 메시지 복사가 아니라 사람이 읽을 문장으로 쓰고 `(#이슈번호)`를 붙입니다. 상세는 [git-convention](./docs/conventions/git-convention.md)의 "변경 이력 기록"을 따릅니다.
- **`main`·`dev`를 rebase하거나 force push하지 마십시오.** 기능 브랜치를 최신 `dev`에 맞출 때만 rebase하고, 그때도 `--force`가 아니라 `--force-with-lease`를 씁니다. 상세는 [git-convention](./docs/conventions/git-convention.md)의 "rebase에서 꼬이는 지점"을 따릅니다.

---

## 3. 기술 스택 (확정)

버전은 2026-08-13 기준 실제 설치값입니다. 패키지를 추가·갱신하면 이 표를 함께 갱신하십시오.

| 구분 | 패키지 | 버전 | 역할 |
| --- | --- | --- | --- |
| 프레임워크 | next | 16.3.0 | App Router 기반 SSR·라우팅 |
| 런타임 | react / react-dom | 19.2.8 | UI 렌더링 |
| 언어 | typescript | 5.9.3 | 타입 안정성 |
| 컴파일러 | babel-plugin-react-compiler | 1.0.0 | 자동 메모이제이션 |
| CSS | tailwindcss | 4.3.3 | 유틸리티 기반 스타일링 |
| UI | shadcn | 4.17.0 | 접근성 내장 컴포넌트 (CLI로 복사) |
| 프리미티브 | radix-ui | 1.6.7 | shadcn 기반. 단일 패키지 |
| 아이콘 | react-icons | 5.7.0 | **메인 아이콘 세트** |
| 아이콘 | lucide-react | 1.31.0 | shadcn 생성 컴포넌트 내부 전용 |
| 애니메이션 | motion | 13.1.0 | 애니메이션 |
| 서버 상태 | @tanstack/react-query | 5.101.4 | API 응답 캐싱·무효화 |
| 클라이언트 상태 | zustand | 5.0.15 | 서버와 무관한 UI 상태 |
| 폼 | react-hook-form | 7.85.0 | 다단계 온보딩·구독 설정 폼 |
| 폼 연결 | @hookform/resolvers | 5.7.1 | react-hook-form과 zod 연결 |
| 스키마 검증 | zod | 4.4.3 | 폼·서버 응답 유효성 검증 |
| 날짜 | date-fns | 4.4.0 | 소진일 계산, D-day, 배송일 |
| 차트 | recharts | 3.10.1 | 소비 리포트, 예측 신뢰구간 |
| 포매터 | prettier | 3.9.6 | prettier-plugin-tailwindcss 포함 |
| 단위 테스트 | vitest | 4.1.10 | jsdom 환경, `@testing-library/react` 16.3.2 병용 |
| E2E 테스트 | @playwright/test | 1.62.1 | chromium 프로젝트, 루트 `e2e/` |
| 린트 | eslint-plugin-boundaries | 7.2.0 | FSD 의존 방향·공개 API 강제 |
| 린트 | eslint-plugin-tailwindcss | 4.2.0 | 임의 값·클래스 오타·상충 검사 |
| 린트 | eslint-plugin-check-file | 3.3.2 | 파일·폴더 kebab-case 강제 |
| 훅 | husky / lint-staged | 9.1.7 / 17.3.0 | pre-commit 린트·포맷, commit-msg 형식 검사 |

**`react-is` 오버라이드는 제거하지 마십시오.** `package.json`의 `overrides`가 `react-is`를 React와 동일한 19.2.8로 고정합니다. Recharts v3가 `react-is`에 의존하는데 버전이 어긋나면 렌더링 단계에서 깨집니다.

**Tailwind CSS v4에는 설정 파일이 없습니다.** `tailwind.config.js`를 만들지 마십시오. 설정은 `src/app/globals.css`의 `@theme` 지시어로 합니다. v3 문서나 예제를 그대로 옮기면 동작하지 않습니다.

---

## 4. 폴더 구조 (FSD)

Feature-Sliced Design을 따릅니다. 상위 레이어는 하위 레이어만 import할 수 있고, **역방향과 같은 레이어 간 참조는 금지**합니다.

```
src/
├── app/        # Next.js App Router + FSD app 레이어 (라우팅, providers, 전역 스타일)
├── views/      # FSD pages 레이어. 페이지 단위 조립
├── widgets/    # 독립적으로 동작하는 큰 UI 블록
├── features/   # 사용자 시나리오 단위 기능
├── entities/   # 비즈니스 엔티티 (반려동물, 상품, 구독, 주문 등)
└── shared/         # 재사용 코드. 비즈니스 로직 없음
    ├── api/        # API 클라이언트, 공통 요청 설정
    ├── config/     # 상수, Query Key, 환경 설정
    ├── lib/        # 순수 유틸리티 (cn 등)
    ├── providers/  # 앱 전역 Provider (AppProviders)
    └── ui/         # shadcn 컴포넌트 및 공용 프리미티브
```

의존 방향은 `app → views → widgets → features → entities → shared` 한 방향뿐입니다.

**`pages`가 아니라 `views`인 이유**를 기억하십시오. Next.js는 `src/pages/`를 Pages Router로 인식하므로 FSD 표준 이름을 그대로 쓸 수 없습니다. 이름을 되돌리지 마십시오.

**`src/app/`은 두 역할을 겸합니다.** Next.js 라우팅 파일(`layout.tsx`, `page.tsx`)과 FSD app 레이어(`providers.tsx`)가 함께 있습니다. 라우트 파일은 얇게 유지하고 실제 화면 조립은 `views/`에 두십시오.

새 슬라이스를 만들 때 세그먼트는 `ui` · `model` · `api` · `lib` · `config`를 사용합니다. shadcn 컴포넌트는 `components.json`의 alias 설정에 따라 `src/shared/ui/`에 자동으로 추가됩니다.

**폴더에는 그 안의 파일을 설명하는 `README.md`를 둡니다.** 슬라이스와 `shared` 세그먼트까지가 대상이고, 세그먼트 내부(`ui/`·`model/`·`api/`)에는 만들지 않습니다. 파일을 추가·삭제하면 README의 파일 표도 함께 갱신하고, 새 슬라이스면 레이어 README의 "현재 슬라이스" 표에도 올립니다. 상세는 [code-convention](./docs/conventions/code-convention.md)의 "폴더 README" 절을 따릅니다.

**루트 `README.md`는 예외입니다.** 프로젝트 소개 문서이므로 파일 설명이나 진행 상황을 넣지 마십시오.

의존 방향과 슬라이스 공개 API는 ESLint(`boundaries/dependencies`)가 강제합니다. lint 에러가 나면 규칙을 우회하지 말고 구조를 고치십시오.

---

## 5. 프로젝트 핵심 원칙

- **모바일 우선(Mobile-First)**: 모든 스타일은 모바일 뷰를 기본으로 작성합니다.
- **표준 단위 사용**: 4px 스케일로 표현되는 길이는 임의 값 대신 표준 단위를 씁니다 (`w-[100px]` → `w-25`, 환산은 px ÷ 4). 상세는 [design-convention](./docs/conventions/design-convention.md)의 "간격과 크기" 절을 따릅니다.
- **SRP 준수**: 모든 컴포넌트와 함수는 하나의 책임만 가집니다.
- **접근성 목표**: Lighthouse 접근성 95점 이상. 경쟁사 3사가 75~89점에 머무는 지점이 이 프로젝트의 차별화 축입니다.

### 5.1 상태 관리 경계

| 도구 | 담당 | 예시 |
| --- | --- | --- |
| TanStack Query | 서버에서 온 모든 데이터 | 예측 결과, 구독 목록, 상품 정보, 주문 내역 |
| Zustand | 서버와 무관한 UI 상태 | 모달 열림 여부, 온보딩 폼 진행 단계, 필터 선택값 |

**서버 데이터를 Zustand에 복사하지 마십시오.** 복사하는 순간 캐시 무효화가 깨집니다.

### 5.2 서버 컴포넌트 경계

Zustand와 TanStack Query는 클라이언트 전용입니다. 경계를 정하지 않으면 `use client`가 상위로 전파되어 App Router의 이점이 사라집니다.

| 영역 | 기본 방침 |
| --- | --- |
| 상품 목록, 상품 상세 | 서버 컴포넌트 우선 |
| 대시보드, 구독 관리 | 클라이언트 컴포넌트 |
| 폼 | 클라이언트 컴포넌트 |

Provider는 트리에서 가능한 한 깊은 곳에 두십시오. `src/shared/providers/app-providers.tsx`의 `AppProviders`가 `<html>` 전체가 아니라 `{children}`만 감싸는 이유입니다. 전역 Provider는 전부 이 파일에서 조립하고 `layout`은 `AppProviders` 하나만 감쌉니다.

### 5.3 아이콘 규칙

- 화면에 직접 배치하는 아이콘은 **react-icons**를 사용합니다.
- `components.json`의 `iconLibrary`는 `lucide`로 유지합니다. shadcn CLI는 react-icons 매핑을 지원하지 않아(지원 목록은 lucide·phosphor·hugeicons·radix), 값을 바꾸면 CLI가 인식하지 못합니다.
- `src/shared/ui/` 하위 shadcn 생성 파일 안의 lucide import는 그대로 두십시오. 손으로 react-icons로 바꾸면 내장된 접근성 속성이 조용히 깨질 수 있습니다.

### 5.4 shadcn 컴포넌트 소유권

shadcn은 라이브러리가 아니라 코드가 저장소에 복사되는 방식입니다. `src/shared/ui/` 하위 파일을 임의로 수정하면 내장된 접근성이 조용히 깨질 수 있습니다. 수정이 필요하면 리뷰를 거치십시오.

### 5.5 차트 사용 규칙

| 규칙 | 내용 |
| --- | --- |
| accessibilityLayer 기본 적용 | 모든 차트에 `accessibilityLayer` prop을 켭니다 |
| 첫 화면 사용 금지 | Recharts는 번들이 큽니다. 대시보드 초기 로드에 포함하지 않습니다 |
| 지연 로드 | 차트가 필요한 화면은 `next/dynamic`으로 불러옵니다 |
| 단순 게이지는 CSS | 잔량 표시에 차트 라이브러리를 쓰지 않습니다 |

잔량 게이지 구현 예시.

```tsx
<div className="bg-muted h-2 w-full rounded-full">
  <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
</div>
```

### 5.6 이미지 규칙

| 규칙 | 근거 |
| --- | --- |
| `next/image` 사용, 원시 `img` 태그 금지 | WebP·AVIF 자동 변환. 국내 3사 모두 미사용 |
| 모든 이미지에 width·height 또는 fill 지정 | 컬리 CLS 0.77 사례 |
| 첫 화면 핵심 이미지에 priority 적용 | 펫프렌즈·컬리 LCP Load delay 75~80% |
| 목록 이미지는 lazy 유지 | 어바웃펫 이미지 464개 즉시 로드 사례 |

### 5.7 React Compiler

React Compiler가 활성화되어 있습니다(`next.config.ts`의 `reactCompiler: true`). `useMemo`와 `useCallback`을 습관적으로 붙이지 마십시오. 코드만 늘어납니다.

단, `useState(() => new QueryClient())`처럼 **인스턴스를 고정하려는 목적**은 메모이제이션이 아니므로 그대로 유지합니다.

---

## 6. 보류 중인 결정 (Pending)

작업 중 이 항목을 마주치면 임의로 해결하지 말고 담당 파트의 확정을 기다리십시오.

| 항목 | 현재 상태 | 해제 조건 |
| --- | --- | --- |
| 한글 본문 폰트 | `--font-sans`가 `Noto_Sans`(latin subset)로 지정되어 한글 글리프가 없습니다. 한글은 시스템 fallback으로 렌더링됩니다. | 디자인팀 폰트 확정 후 `layout.tsx`와 `globals.css`의 `@theme` 매핑을 함께 교체 |
| 디자인 토큰 | `globals.css`가 shadcn 기본 neutral 팔레트 상태입니다. | 디자인팀 Design Tokens 명세 전달 후 |
| 테마 토글 | 메인 페이지에 데모 버튼(`features/toggle-theme`)만 있습니다. 선택이 저장되지 않아 새로고침하면 라이트로 돌아갑니다. | 디자인 확정 후 정식 테마 도구(next-themes 등) 결정 |
| 앱 메시지 체계 | `APP_MESSAGE`·`FORM_MESSAGE`·Toast 미도입. 규칙만 문서로 존재합니다. | 공통 Error 핸들러와 Toast 도입 시점 |
| API 계약 | 미확정. | 백엔드 팀 Swagger 명세 공유 후 |

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
