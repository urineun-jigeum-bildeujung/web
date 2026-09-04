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

## 상태를 어디에 두는가

자리가 셋이다.

| 자리 | 담는 것 | 예 |
|---|---|---|
| TanStack Query | 서버에서 온 데이터 | 상품 목록, 예측 결과, 구독 정보 |
| URL 쿼리 (`nuqs`) | 새로고침·뒤로가기에서 살아남아야 하는 화면 상태 | 필터, 정렬, 탭, 페이지, 검색어 |
| `useState` / Zustand | 그 순간에만 유효한 UI 상태 | 모달 열림, 바텀시트, 입력 중인 값 |

**기준은 "새로고침했을 때 남아 있어야 하는가"다.** 남아 있어야 하면 URL이고, 아니면 컴포넌트 상태다.

URL에 두면 두 가지가 따라온다.

- 목록 → 상세 → 뒤로가기에서 고른 조건이 유지된다. 경쟁사 앱 리뷰에서 가장 많이 나온 불만이 이것이다
- 필터 값을 컴포넌트가 들지 않으므로 **목록 화면을 서버 컴포넌트로 유지할 수 있다.** `useState`로 들면 그 화면이 통째로 클라이언트가 되어 위 표의 "상품 목록은 서버 컴포넌트 우선"과 어긋난다

`NuqsAdapter`는 `shared/providers/app-providers.tsx`에 있다. 어댑터 없이 `useQueryState`를 쓰면 런타임에 터진다.

### 화면 구성이 바뀌는 값이면 `history: "push"`

`useQueryState`의 기본값은 `history: "replace"`다. **주소는 바뀌지만 히스토리에 쌓이지 않아, 탭을 옮긴 뒤 뒤로가기를 누르면 이전 탭이 아니라 화면을 통째로 떠난다.**

| 값의 성격 | 설정 | 예 |
|---|---|---|
| 화면 구성이나 단계가 바뀌는 값 | `history: "push"` | 탭, 온보딩 단계, 메인의 종류 |
| 같은 목록을 좁히는 값 | 기본값 그대로 | 필터, 정렬 |

```tsx
parseAsStringLiteral(TABS).withDefault("liked").withOptions({ history: "push" })
```

**필터·정렬까지 쌓으면 안 된다.** 조건을 여러 번 바꾼 뒤 뒤로가기를 누르면 그만큼 눌러야 화면을 떠나게 된다.

온보딩이 특히 중요하다. 이름·품종까지 입력하다 뒤로가기를 누르면 입력값이 통째로 사라졌다. **WebView 앱으로 감쌀 예정이라 기기 뒤로가기 버튼이 실제 사용 경로다.**

### 주소로 받는 값은 `parseAsStringLiteral`로 보기를 제한한다

`parseAsString`은 값을 검증하지 않는다. `?category=legacy` 같은 값이 오면 걸러 낸 결과가 비어 **목록이 통째로 사라진다.** 보기가 정해진 값은 리터럴로 받는다.

```tsx
const TABS = ["liked", "recent", "often"] as const;
useQueryState("tab", parseAsStringLiteral(TABS).withDefault("liked"));
```

보기를 미리 적을 수 없는 값(아이 id처럼 서버에서 오는 것)은 `parseAsString`을 쓰되, **읽는 쪽에서 목록에 없으면 기본값으로 되돌린다.** 어느 쪽인지 주석으로 남긴다.

### 서버가 다시 조회해야 하는 값이면 `shallow: false`

`useQueryState`의 기본값은 `shallow: true`다. **URL만 바뀌고 서버는 그 사실을 모른다.** 위의 "서버 컴포넌트로 유지할 수 있다"는 이 옵션을 켰을 때 성립한다.

| 값의 성격 | 설정 |
|---|---|
| 클라이언트가 이미 받은 데이터로 거르는 값 | 기본값 그대로 |
| 서버가 다시 조회해야 하는 값 (검색 정렬, 페이지, 서버 필터) | `shallow: false` |

**`useQueryState`를 쓰는 화면은 라우트에서 `Suspense`로 감싼다.** 내부에서 `useSearchParams`를 부르므로 감싸지 않으면 정적 프리렌더가 실패한다(`missing-suspense-with-csr-bailout`). 빌드에서만 드러나고 dev에서는 통과하므로 화면을 만들 때 함께 넣는다.

```tsx
export default function Page() {
  return (
    <Suspense>
      <SomeView />
    </Suspense>
  );
}
```

서버 컴포넌트는 `page.tsx`의 `searchParams`로 읽는다. 같은 파서를 클라이언트와 서버가 나눠 쓰려면 `nuqs/server`의 파서·캐시를 쓴다. 훅 자체는 클라이언트 전용이므로 **목록을 감싼 최상위가 아니라 필터 UI 컴포넌트에 둔다.** 최상위에 두면 목록 전체가 클라이언트로 넘어가 이 절의 목적이 사라진다.

## SRP 체크리스트

1. [ ] 컴포넌트에 API 호출이 직접 있는가 → 슬라이스 `api/`(query/mutation 훅)로 이동
2. [ ] 컴포넌트에 복잡한 포맷팅·정규식이 있는가 → `lib`(순수 함수)로 이동
3. [ ] 한 컴포넌트가 폼 관리·데이터 페칭·렌더를 모두 하는가 → 훅/model로 로직 분리
4. [ ] 반복되는 상수가 하드코딩됐는가 → `shared/config`로 이동
5. [ ] 서버 데이터를 Zustand에 복사했는가 → TanStack Query 캐시를 그대로 쓴다
