# 골라주개

> 고민은 줄이고, 우리 애한테 맞게 골라주개

소비량 예측형 스마트 구독 커머스 (반려동물 카테고리)의 프론트엔드 저장소입니다.

반려동물은 자신의 상태를 말로 표현할 수 없습니다. 보호자는 기호성·섭취량·변 상태·눈물 자국·체중 변화 같은 간접 신호만으로 "이 선택이 맞았는가"를 계속 추측해야 합니다. 골라주개는 반려동물의 선택과 반응을 데이터로 연결해 그 **추측을 근거 있는 판단으로** 바꿉니다.

- 프로필과 건강 상태를 기반으로 맞지 않는 상품을 먼저 걸러내 탐색 부담을 줄입니다.
- 별점·인기순이 아니라 "왜 우리 아이에게 추천하는지" 근거를 제공합니다.
- 구매 이후 섭취량·기호성·체중·변 상태를 기록해 사용 전후 변화를 확인합니다.
- 과거의 반응을 다음 추천에 반영해 맞지 않았던 선택을 반복하지 않게 합니다.

---

## 시작하기

**요구 사항**은 Node.js 20.9.0 이상입니다. (개발 환경 검증 버전은 Node 22.22.2, npm 11.2.0)

```bash
npm install
```

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인합니다.

### 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 및 타입 체크 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | 타입 검사 (`tsc --noEmit`) |
| `npm run format` | Prettier 포맷 적용 |
| `npm run format:check` | 포맷 위반 확인 (수정 없음) |
| `npm run test` | Vitest 단위 테스트 1회 실행 |
| `npm run test:watch` | Vitest watch 모드 |
| `npm run test:e2e` | Playwright E2E 테스트 |
| `npm run knip` | 미사용 파일·export·의존성 검사 |

> 모든 명령은 **프로젝트 루트**에서 실행하십시오. `src/` 안에서 실행하면 Next가 `src`를 프로젝트 루트로 오인해 경로 별칭이 깨집니다.

### 환경 변수

`.env.example`을 복사해 `.env.local`을 만듭니다. 타입은 `env.d.ts`에 선언합니다.

```bash
cp .env.example .env.local
```

---

## 기술 스택

버전은 2026-08-13 기준 실제 설치값입니다.

### 코어

| 구분 | 패키지 | 버전 |
| --- | --- | --- |
| 프레임워크 | Next.js (App Router) | 16.3.0 |
| 런타임 | React | 19.2.8 |
| 언어 | TypeScript | 5.9.3 |
| 컴파일러 | babel-plugin-react-compiler | 1.0.0 |

### 스타일과 UI

| 구분 | 패키지 | 버전 |
| --- | --- | --- |
| CSS | Tailwind CSS | 4.3.3 |
| UI 컴포넌트 | shadcn/ui | 4.17.0 |
| 프리미티브 | radix-ui | 1.6.7 |
| 아이콘 (메인) | react-icons | 5.7.0 |
| 아이콘 (shadcn 내부) | lucide-react | 1.31.0 |
| 애니메이션 | motion | 13.1.0 |

### 상태·폼·데이터

| 구분 | 패키지 | 버전 |
| --- | --- | --- |
| 서버 상태 | @tanstack/react-query | 5.101.4 |
| 클라이언트 상태 | zustand | 5.0.15 |
| 폼 | react-hook-form | 7.85.0 |
| 폼 연결 | @hookform/resolvers | 5.7.1 |
| 스키마 검증 | zod | 4.4.3 |
| 날짜 | date-fns | 4.4.0 |
| 차트 | recharts | 3.10.1 |

### 테스트

| 구분 | 패키지 | 버전 |
| --- | --- | --- |
| 단위 | vitest | 4.1.10 |
| 단위 | @testing-library/react | 16.3.2 |
| E2E | @playwright/test | 1.62.1 |

### 설치 시 주의사항

- **`package.json`의 `overrides`를 제거하지 마십시오.** `react-is`를 React와 동일한 19.2.8로 고정합니다. Recharts v3가 `react-is`에 의존하는데 버전이 어긋나면 렌더링이 깨집니다.
- **Tailwind v4에는 설정 파일이 없습니다.** `tailwind.config.js`를 만들지 마십시오. 설정은 `src/app/globals.css`의 `@theme` 지시어로 합니다.
- **Radix UI는 단일 패키지입니다.** `@radix-ui/react-*` 개별 패키지를 설치하지 마십시오.
- **shadcn CLI는 react-icons를 지원하지 않습니다.** `components.json`의 `iconLibrary`는 `lucide`로 유지하고, 화면에 직접 배치하는 아이콘만 react-icons를 씁니다.

---

## 폴더 구조

Feature-Sliced Design(FSD)을 따릅니다.

```
src/
├── app/            # Next.js App Router 라우팅 (얇게 유지, 전역 스타일)
├── views/          # FSD pages 레이어. 페이지 단위 조립
├── widgets/        # 독립적으로 동작하는 큰 UI 블록
├── features/       # 사용자 시나리오 단위 기능
├── entities/       # 비즈니스 엔티티 (반려동물, 상품, 구독, 주문 등)
└── shared/         # 재사용 코드. 비즈니스 로직 없음
    ├── api/        # API 클라이언트, 공통 요청 설정
    ├── config/     # 상수, Query Key, 환경 설정
    ├── lib/        # 순수 유틸리티
    ├── providers/  # 앱 전역 Provider (AppProviders)
    └── ui/         # shadcn 컴포넌트 및 공용 프리미티브
```

각 레이어 폴더의 `README.md`에 역할과 담지 않는 것이 정리되어 있습니다.

의존 방향은 `app → views → widgets → features → entities → shared` 한 방향뿐입니다. 역방향과 같은 레이어 간 참조는 금지합니다.

FSD 표준의 `pages` 레이어를 **`views`로 부르는 이유**는 Next.js가 `src/pages/`를 Pages Router로 인식하기 때문입니다. 이름을 되돌리지 마십시오.

---

### 일정

| 단계 | 마감 | 내용 |
| --- | --- | --- |
| 계획·분석 | 8/21 | 프로젝트 설계, 폴더 구조화, 저장소 세팅, 팀 컨벤션 |
| 설계 | 8/28 | 페이지 설계, 라우터 설계, API 명세서 |
| 구현 | 9/18 | 페이지 구현, API 연동, 접근성 개선 |
| 테스트 | 10/1 | 단위 테스트, E2E 테스트, 성능 측정 |

---

## 진행 상황

하나의 작업(이슈)이 끝날 때마다 이 섹션을 갱신합니다.

### 완료

- [x] 기술 스택 설치와 의존성 정합성 확보 (`react-is` 오버라이드 포함)
- [x] FSD 폴더 구조와 레이어별 README
- [x] 컨벤션 문서 7종 (`docs/conventions`)
- [x] Prettier·LF·에디터 설정, GitHub 이슈·PR 템플릿
- [x] Claude Code 하네스 (`.claude` — 커맨드 4종, code-reviewer, 훅)
- [x] TanStack Query Provider 배선 (`shared/providers`)
- [x] 초기 세팅 안내 홈 화면 + 다크 모드 데모 토글
- [x] 테스트 환경 (Vitest 단위 5건, Playwright E2E 2건)
- [x] ESLint 강제 (FSD 경계 `boundaries`, Tailwind 클래스, 파일명, import 위치)
- [x] CI 워크플로우 (GitHub Actions — typecheck·format·lint·knip·test·build·E2E)
- [x] husky 로컬 훅 (pre-commit 린트·포맷, commit-msg 형식 검사)
- [x] 미사용 코드 검사 (knip — CI에서 실행)
- [x] CodeRabbit 리뷰 설정

### 다음

- [ ] 원격 저장소 생성, `dev` 브랜치·default 설정, rebase 전용 머지 설정 (팀장)
- [ ] 페이지 설계·라우터 설계 (~8/28)
- [ ] 디자인 토큰·한글 폰트 적용 (디자인팀 명세 대기)
- [ ] API 계약 (백엔드 Swagger 공유 대기)

---

## 작업 전 확인

AI 에이전트와 팀원 모두 [AGENTS.md](./AGENTS.md)의 행동 지침과 스택 사용 규칙을 먼저 읽으십시오. 상태 관리 경계, 서버 컴포넌트 경계, 차트·이미지 규칙, 보류 중인 결정 목록이 정리되어 있습니다.

Next.js 16은 이전 버전과 API가 다른 부분이 있습니다. 구현 전 `node_modules/next/dist/docs/`의 해당 가이드를 확인하십시오.

세부 규칙은 [docs/conventions](./docs/conventions/README.md)에 있습니다. 네이밍·FSD 구조·디자인·검증·Git 규칙을 다루며, 팀원과 AI 에이전트 모두 이 문서를 기준으로 작업합니다.

### Claude Code 설정

`.claude/`에 팀 공용 설정이 있습니다.

| 커맨드 | 하는 일 |
| --- | --- |
| `/verify` | typecheck → format:check → lint → build 순서로 검증 |
| `/new-slice <layer> <name>` | FSD 슬라이스 뼈대 생성 |
| `/start-task <설명>` | 이슈 생성 + 기능 브랜치 분기 |
| `/pr` | 검증 → 이슈 업데이트 → PR 생성 |

`code-reviewer` 에이전트가 커밋·PR 전 컨벤션 위반을 점검합니다. `settings.json`의 `attribution`은 커밋·PR에서 AI 표기가 붙지 않도록 막습니다.
