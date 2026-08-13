# app 레이어

Next.js App Router의 라우팅 디렉터리이자 FSD의 최상위 레이어다. 두 역할을 겸한다.

## 담는 것

- Next.js 라우팅 파일 — `layout.tsx`, `page.tsx`, `not-found.tsx`, `error.tsx`, `route.ts`
- 전역 스타일 — `globals.css`
- 파일 기반 메타데이터 — `favicon.ico`, `opengraph-image` 등

## 담지 않는 것

- **화면 조립 로직.** `page.tsx`는 `views`의 컴포넌트를 불러 렌더하는 얇은 껍데기로 유지한다.
- **Provider 조립.** 전역 Provider는 `shared/providers`에 두고 `layout`은 `AppProviders` 하나만 감싼다.
- 비즈니스 로직, 재사용 컴포넌트.

## 의존 방향

모든 레이어를 import할 수 있다. 어떤 레이어도 `app`을 import하지 않는다.

## 주의

파일명은 Next.js 규약을 그대로 따른다. 이 레이어에서만 kebab-case 규칙의 예외가 적용된다.

라우트 세그먼트 폴더는 kebab-case로 만든다. 이 이름이 곧 URL이 된다.
