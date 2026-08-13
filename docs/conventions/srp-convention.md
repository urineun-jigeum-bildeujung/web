# 아키텍처·SRP 컨벤션 (FSD)

레이어의 역할과 의존 방향은 각 `src/<layer>/README.md`에 있다. 이 문서는 **슬라이스 내부의 단일 책임**과 "이 코드 어디 두지?"를 다룬다.

> **이 프로젝트의 전제**: 우리는 Next.js 16 App Router를 **SSR로 그대로 쓴다.** Static Export가 아니므로 서버 컴포넌트에서의 데이터 페칭, 라우트 핸들러, `proxy.ts`를 쓸 수 있다. 백엔드는 **Spring Boot REST API**(별도 저장소)이며, 프론트에서 DB에 직접 접근하지 않는다. BaaS 클라이언트나 DB 자동 생성 타입은 이 프로젝트에 없다.

## 슬라이스 구조 (세그먼트)

한 슬라이스(`features/write-review/`, `entities/pet/` 등)는 필요한 세그먼트만 갖고 `index.ts`로 공개 API를 노출한다.

| 세그먼트 | 담는 것 |
|---|---|
| `ui/` | 컴포넌트 (렌더링만, 로직은 model/hook로) |
| `model/` | 타입, Zustand 스토어, 순수 로직 |
| `api/` | 백엔드 REST API 호출 (fetch 함수, TanStack Query 훅) |
| `lib/` | 그 슬라이스 전용 순수 유틸 |

바깥에서는 `index.ts`가 노출한 것만 import한다. 슬라이스 내부 파일을 깊게 참조하지 않는다.

의존 방향과 공개 API 규칙은 ESLint(`boundaries/dependencies`)가 강제한다. `views`·`widgets`·`features`·`entities`는 `index.ts(x)`로만 들어갈 수 있고, `shared`는 세그먼트 직접 import를 허용한다. lint 에러가 나면 규칙을 우회하지 말고 구조를 고친다.

## 이 코드 어디 두지

| 대상 | 위치 |
|---|---|
| 화면 조립(라우트 1:1) | `views/<name>` |
| 독립 UI 블록 | `widgets/<name>` |
| 사용자 행동(폼·mutation) | `features/<name>/{ui,model,api}` |
| 도메인 모델·카드·조회 | `entities/<name>/{ui,model,api}` |
| shadcn 컴포넌트·공용 프리미티브 | `shared/ui` |
| 외부 lib 설정(motion 프리셋, 공용 zod 스키마 등) | `shared/lib/<라이브러리>/` — 라이브러리·주제별 폴더. 상세는 [code-convention](code-convention.md)의 "shared/lib 폴더 구조" |
| 상수·Query Key·앱 메시지 | `shared/config` |
| 앱 전역 Provider(Query·Theme·Toaster) | `shared/providers` — `app/`은 라우팅 껍데기라 조립 로직을 두지 않는다. `layout`은 `AppProviders` 하나만 감싼다 |
| 전역 스토어(auth 세션 등) | `shared` (슬라이스 전용 스토어는 그 슬라이스 `model`) |
| 백엔드 응답 타입 | API 계약 확정 시 위치를 정한다 (미정) |

## 서버 컴포넌트와 클라이언트 컴포넌트

Static Export가 아니므로 서버 컴포넌트를 적극적으로 쓴다. 다만 TanStack Query와 Zustand는 클라이언트 전용이라 경계를 정하지 않으면 `use client`가 상위로 전파된다.

| 영역 | 기본 방침 |
|---|---|
| 상품 목록, 상품 상세 | 서버 컴포넌트 우선 |
| 대시보드, 구독 관리 | 클라이언트 컴포넌트 |
| 폼 | 클라이언트 컴포넌트 |

`use client`는 필요한 가장 낮은 지점에 붙인다. 레이아웃이나 페이지 최상단에 붙여서 하위 전체를 클라이언트로 만들지 않는다.

## SRP 체크리스트

1. [ ] 컴포넌트에 API 호출이 직접 있는가 → 슬라이스 `api/`(query/mutation 훅)로 이동
2. [ ] 컴포넌트에 복잡한 포맷팅·정규식이 있는가 → `lib`(순수 함수)로 이동
3. [ ] 한 컴포넌트가 폼 관리·데이터 페칭·렌더를 모두 하는가 → 훅/model로 로직 분리
4. [ ] 반복되는 상수가 하드코딩됐는가 → `shared/config`로 이동
5. [ ] 서버 데이터를 Zustand에 복사했는가 → TanStack Query 캐시를 그대로 쓴다
