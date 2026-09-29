# app 레이어

Next.js App Router의 라우팅 디렉터리이자 FSD의 최상위 레이어다. 두 역할을 겸한다.

## 담는 것

- Next.js 라우팅 파일 — `layout.tsx`, `page.tsx`, `not-found.tsx`, `error.tsx`, `route.ts`
- 전역 스타일 — `globals.css`
- 파일 기반 메타데이터 — `favicon.ico`, `opengraph-image` 등

## 담지 않는 것

- **화면 조립 로직.** `page.tsx`는 `views`의 컴포넌트를 불러 렌더하는 얇은 껍데기로 유지한다.
- **Provider 조립.** 전역 Provider는 `shared/providers`에 두고 `layout`은 `AppProviders` 하나만 감싼다. 로그인이 필요한 구간의 `layout`은 `shared/providers`의 `SessionGuard` 하나만 감싼다(`mypage/layout.tsx`, #447).
- 비즈니스 로직, 재사용 컴포넌트.

## `(constrained)` 라우트 그룹

**아직 태블릿·웹 시안이 없는 화면을 모바일 폭(420px) 기둥에 담는 자리다**(#491). `(constrained)/layout.tsx`가 그 기둥을 지고, 루트 `layout.tsx`는 폭을 제한하지 않는다.

시안이 온 화면은 이 그룹 밖으로 폴더를 옮기면서 제 폭을 스스로 정한다. 화면이 하나씩 준비되는 동안 **아직 작업하지 않은 화면이 넓은 뷰포트에서 혼자 퍼지지 않게** 하는 것이 목적이다. 반응형 대응은 #132가 추적한다.

**지금 그룹 밖으로 나온 화면은 홈(`page.tsx`) 하나다**(#496). 나온 화면은 컨테이너 폭뿐 아니라 **이미지 `sizes`도 스스로 정해야 한다** — 기본값이 420px 기둥을 전제하고 있어 그대로 두면 넓은 화면에서 저해상도 후보가 뽑힌다.

라우트 그룹은 URL에 들어가지 않는다. `(constrained)/cart/page.tsx`는 그대로 `/cart`다.

**옮기지 않는 것이 있다.**

- `api/` · `metrics/` · `firebase-messaging-sw.js` — route handler라 레이아웃과 무관하다
- `error.tsx` · `not-found.tsx` · `global-error.tsx` — 그룹 밖 루트에 두고 **폭과 높이를 각자 직접 가진다.** 그룹 안에 복제해도 그룹 레이아웃 자체에서 난 오류는 잡지 못한다(Next 문서: 같은 세그먼트의 `layout`은 감싸지 않는다)

## 의존 방향

모든 레이어를 import할 수 있다. 어떤 레이어도 `app`을 import하지 않는다.

## 주의

파일명은 Next.js 규약을 그대로 따른다. 이 레이어에서만 kebab-case 규칙의 예외가 적용된다.

라우트 세그먼트 폴더는 kebab-case로 만든다. 이 이름이 곧 URL이 된다.
