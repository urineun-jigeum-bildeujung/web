---
description: 공용 컴포넌트 생성 — 컨벤션대로 뼈대와 테스트를 만든다
argument-hint: <layer> <name> [근거 화면 ID]
---

`$ARGUMENTS`로 컴포넌트를 스캐폴드한다. 형식: `<layer> <name> [근거]`.

- **layer**: `shared` | `entities/<도메인>` | `features/<시나리오>` | `views/<화면>`
- **name**: kebab-case (예: `bottom-action-bar`)
- **근거**: 와이어프레임 화면 ID(`onbo_002`, `mypa_311`) 또는 `IA`

`docs/conventions/component-convention.md`를 따른다. 아래는 그 문서의 실행 절차다.

## 1. 위치를 먼저 확인한다

**도메인 타입을 알아야 하면 `entities`, 몰라도 되면 `shared/ui`다.** layer 인자가 이 기준과 어긋나 보이면 만들지 말고 사용자에게 먼저 묻는다.

`shared`를 대상으로 부르면 `src/shared/ui/`에 만든다. `shared`는 슬라이스가 없고 세그먼트가 바로 온다.

## 2. shadcn이 제공하는지 확인한다

`Skeleton`·`Badge`·`Tabs`처럼 shadcn에 있는 것은 만들지 말고 CLI로 받는다. 의존 패키지도 CLI가 함께 설치하므로 손으로 설치하지 않는다.

이미 `src/shared/ui/`에 같은 이름이 있으면 덮어쓰지 않고 보고한다.

## 3. 파일을 만든다

`<layer 경로>/ui/<name>.tsx`

첫 줄에 한국어 역할 주석을 쓰고, **근거를 함께 남긴다.**

```tsx
// 화면 하단에 고정되는 버튼 줄. 1~2개 버튼과 비활성 상태를 다룬다.
// 와이어프레임 기준(onbo_002, mypa_311)이라 디자인 확정 시 바뀔 수 있다.
```

근거가 `IA`면 그렇게 적는다.

```tsx
// 목록이 비었을 때 안내와 다음 행동을 보여준다.
// IA 기준(타임딜·배송지·검색 결과)이며 시안은 아직 없다.
```

컴포넌트를 짤 때 지킨다.

- 이름은 PascalCase, 파일은 kebab-case
- `className`을 받아 `cn`으로 병합한다
- 나머지 HTML 속성은 `...props`로 넘긴다
- boolean을 늘어놓지 말고 `cva`로 `variant`를 정의한다
- 색은 시맨틱 토큰만 쓴다. HEX를 적지 않는다
- 4px 스케일은 표준 단위로 쓴다 (`w-[100px]` → `w-25`)
- 누르는 것은 `button`, 이동은 `Link`. 아이콘만 있는 버튼에는 `aria-label`을 준다

## 4. 테스트를 함께 만든다

`<name>.test.tsx`로 렌더링 스모크를 둔다. 셀렉터는 `getByRole` 같은 역할 기반을 쓴다.

계산이 들어간 컴포넌트(할인율·남은 시간)는 케이스를 나눠 검증한다.

**검증할 것이 없으면 만들지 말고 왜 없는지 보고에 한 줄로 밝힌다.** 껍데기 테스트는 통과율만 올린다.

## 5. 공개 API와 README를 갱신한다

- `entities`·`features`·`views`에 만들었으면 그 슬라이스 `index.ts`에서 re-export한다. 바깥에서는 `index.ts`로만 들어온다
- `shared/ui`는 세그먼트 직접 import를 허용하므로 배럴을 만들지 않는다
- 해당 폴더 `README.md`의 파일 표에 한 줄 추가한다

## 6. 검증하고 보고한다

`npm run typecheck` → `format:check` → `lint` → `test` 순으로 돌린다. 단일 파일 추가라도 lint는 반드시 돌린다 — `jsx-a11y` 규칙 31개가 여기서 걸린다.

만든 경로와 검증 결과를 보고한다. 컨벤션 체크리스트 8항목 중 해당하지 않는 것이 있으면 이유를 밝힌다.
