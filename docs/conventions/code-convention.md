# 코드 컨벤션

## 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| 변수·함수 | camelCase | `petName`, `getProductList()`, `isLoading` |
| 파일·폴더 | kebab-case | `pet-card.tsx`, `use-query-subscriptions.ts` |
| 컴포넌트 | PascalCase | `PetCard`, `BottomNav` |
| 상수 | UPPER_SNAKE_CASE | `PET_SPECIES`, `QUERY_KEYS` |
| 타입·인터페이스 | PascalCase | `interface Props`, `type Product` |

**파일명은 kebab-case로 통일한다.** FSD·Next 커뮤니티에서 가장 널리 쓰이고, Linux CI의 대소문자 이슈가 없다. 컴포넌트는 이름만 PascalCase이고 파일은 kebab-case다 (`PetCard` → `pet-card.tsx`).

예외는 Next.js가 파일명을 규약으로 쓰는 경우다. `layout.tsx`, `page.tsx`, `not-found.tsx`, `route.ts` 등은 프레임워크가 정한 이름을 그대로 쓴다.

## 훅

- 파일 kebab-case (`use-query-subscriptions.ts`), 함수 camelCase (`useQuerySubscriptions()`), `use-` 접두.
- TanStack Query를 쓰는 로직은 반드시 `use-query-*.ts` 형태의 훅으로 감싼다. 컴포넌트에서 `useQuery`를 직접 호출하지 않는다.
- 컴포넌트 안에서 `useForm`/`useState`/`useEffect` 기반 로직이 3줄 이상이면 커스텀 훅으로 분리한다.

### `useEffect` 단일 상태 보정

선택값이 탭·권한·옵션 변경으로 더 이상 유효하지 않아 기본값으로 되돌릴 때만, 해당 줄에서 lint를 끈다.

```tsx
useEffect(() => {
  if (!options.includes(value)) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(DEFAULT_VALUE);
  }
}, [value, options]);
```

### React Compiler

React Compiler가 켜져 있다(`next.config.ts`의 `reactCompiler: true`). `useMemo`·`useCallback`을 습관적으로 붙이지 않는다.

단 `useState(() => new QueryClient())`처럼 **인스턴스를 고정하려는 목적**은 메모이제이션이 아니므로 유지한다.

## TanStack Query Key

- Query Key는 `shared/config/query-keys.ts`의 `QUERY_KEYS`에서 **중앙 관리**한다.
- 호출부에서 `[...QUERY_KEYS.product.all, "list"]`처럼 부분 배열을 직접 만들지 않는다.
- 하위 리소스 전체 대상(`invalidateQueries`, `setQueriesData` 등)이 필요하면 `listAll()`, `searchAll()` 같은 하위 루트 factory를 `QUERY_KEYS`에 먼저 추가하고 호출부는 그 factory만 쓴다.
- 개별 factory는 하위 루트 factory를 펼쳐 계층을 맞춘다 (`list()`는 `listAll()`을 펼치고 식별자·필터를 붙임).
- optional 값 제거는 `filter(Boolean)`이 아니라 `filter((v) => v !== undefined)`를 쓴다.
- 새 도메인은 `all`을 최상위 루트로, 재사용 하위 루트는 `{resource}All()` 형태로 명명한다.

> `shared/config/query-keys.ts`는 아직 없다. 첫 API 연동을 하는 사람이 이 규칙대로 만든다.

## 타입

- 백엔드 응답 타입은 손으로 옮겨 적지 말고 API 명세(Swagger)를 기준으로 한곳에서 관리한다. 위치는 API 계약 확정 시 정한다.
- 타입을 맞추기 위한 `as unknown as` 이중 단언을 쓰지 않는다. 응답 타입 정의와 실제 사용 필드를 일치시킨다.
- API 명세상 nullable이 아닌 값에 불필요한 fallback을 넣지 않는다.

## 테스트

- **단위 테스트는 Vitest.** 대상 파일 바로 옆에 `<파일명>.test.ts(x)`로 둔다 (colocation). 별도 `__tests__` 폴더를 만들지 않는다.
- **E2E는 Playwright.** 루트 `e2e/` 폴더에 `<플로우>.spec.ts`로 둔다.
- 단위 테스트는 순수 함수 위주로 작성하고, 컴포넌트는 렌더링 스모크 수준까지만 단위로 다룬다. 사용자 플로우는 E2E가 맡는다.
- 실행은 `npm run test`(1회) · `npm run test:watch` · `npm run test:e2e`.

## shared/lib 폴더 구조

**라이브러리·주제 단위로 폴더를 만들고 그 안에 파일을 둔다.** `utils.ts` 같은 포괄 이름의 파일이 늘어나면 무엇이 어디 있는지 찾을 수 없게 된다.

```
shared/lib/
├── motion/       # motion 프리셋 (variants, transition 상수)
├── date/         # date-fns 래퍼, 포맷 함수
└── utils.ts      # 예외 — shadcn CLI 소유 (cn). 위치·이름을 바꾸지 않는다
```

- 폴더명은 라이브러리 이름(`motion`, `date`)이나 주제(`format`)로 짓는다.
- `utils.ts`는 shadcn CLI가 `components.json`의 alias로 참조하고 덮어쓰는 파일이라 **예외로 현 위치를 유지한다.** cn 외의 유틸을 이 파일에 추가하지 않는다.
- 폴더를 미리 만들지 않는다. 첫 파일이 생길 때 폴더를 만든다.

## 포맷

포맷은 Prettier가 강제한다. 손으로 맞추지 않는다.

- 줄바꿈은 **LF**. `.gitattributes`와 `.prettierrc`의 `endOfLine`이 강제한다.
- `printWidth`는 100이다.
- `src/shared/ui/`와 `src/shared/lib/utils.ts`는 shadcn CLI가 덮어쓰므로 `.prettierignore` 대상이다. 이 파일들의 스타일을 손으로 맞추지 않는다.
