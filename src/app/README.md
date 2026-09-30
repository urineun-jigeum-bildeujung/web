# app 레이어

Next.js App Router의 라우팅 디렉터리이자 FSD의 최상위 레이어다. 두 역할을 겸한다.

## 담는 것

- Next.js 라우팅 파일 — `layout.tsx`, `page.tsx`, `not-found.tsx`, `error.tsx`, `route.ts`
- 전역 스타일 — `globals.css`
- 파일 기반 메타데이터 — `favicon.ico`, `opengraph-image` 등

## 담지 않는 것

- **화면 조립 로직.** `page.tsx`는 `views`의 컴포넌트를 불러 렌더하는 얇은 껍데기로 유지한다.
- **Provider 조립.** 전역 Provider는 `shared/providers`에 두고 `layout`은 `AppProviders` 하나만 감싼다. 로그인이 필요한 구간의 `layout`은 `shared/providers`의 `SessionGuard` 하나만 감싼다(`(constrained)/(member)/layout.tsx`, #447·#542).
- 비즈니스 로직, 재사용 컴포넌트.

## `(constrained)` 라우트 그룹

**아직 태블릿·웹 시안이 없는 화면을 모바일 폭(420px) 기둥에 담는 자리다**(#491). `(constrained)/layout.tsx`가 그 기둥을 지고, 루트 `layout.tsx`는 폭을 제한하지 않는다.

시안이 온 화면은 이 그룹 밖으로 폴더를 옮기면서 제 폭을 스스로 정한다. 화면이 하나씩 준비되는 동안 **아직 작업하지 않은 화면이 넓은 뷰포트에서 혼자 퍼지지 않게** 하는 것이 목적이다. 반응형 대응은 #132가 추적한다.

**지금 그룹 밖으로 나온 화면은 홈(`page.tsx`, #496)과 검색(`search/`, #573)이다.** 나온 화면은 컨테이너 폭뿐 아니라 **이미지 `sizes`도 스스로 정해야 한다** — 기본값이 420px 기둥을 전제하고 있어 그대로 두면 넓은 화면에서 저해상도 후보가 뽑힌다.

**시안이 없는 화면도 나올 수 있다.** 검색 결과(`/search/result`)는 태블릿·웹 시안이 없는데, 2026-09-30에 PD가 반응형 시안을 더 그리지 않는 것과 격자 규칙(**카드 170px 고정 · 간격 13px · 좌우 여백 20px**)을 함께 확정해 그 규칙으로 나왔다. 규칙이 있으면 시안을 기다리지 않는다.

라우트 그룹은 URL에 들어가지 않는다. `(constrained)/cart/page.tsx`는 그대로 `/cart`다.

**그룹 밖으로 나온 화면은 뷰 최상위 래퍼가 제 폭을 진다.** 홈(`home-view.tsx`)과 상품 상세(`product-detail-view.tsx`)가 둘 다 `mx-auto flex min-h-dvh w-full max-w-300 flex-col`로 1200px 기둥을 세운다 — 라우트 레이아웃을 따로 만들지 않는다. **거터는 컨테이너가 아니라 섹션이 갖는다**(`px-5`). 상품 이미지와 가로 스크롤 줄이 화면 끝까지 흘러야 해서, 래퍼가 좌우 여백을 쥐면 그 구역마다 음수 마진으로 다시 취소해야 한다.

**`fixed`와 포털은 그 기둥을 물려받지 못한다.** 뷰포트 기준이거나 body 아래 그려져서다. 상품 상세의 맨 위로 가기 버튼이 같은 `max-w-300`을 한 번 더 적는 이유다.

**포털로 뜨는 것은 아직 그룹 밖 화면에 없다.** 리뷰 필터의 품종·건강 관심사 전체화면(`review-filter-picker.tsx`)이 그 경우인데, 시트가 어디에도 걸려 있지 않아 지금은 열리지 않는다 — 실제로 폭을 잴 수 없어 420px 기준을 그대로 두고 **시트를 여는 #472에서 함께 맞춘다.** 그때 shadcn 베이스가 `sm:max-w-sm`이라 **`sm:` 접두사까지 같이 줘야 이긴다**는 점을 주의한다(tailwind-merge는 변형 체인이 다르면 충돌로 보지 않는다).

**상품 상세 하위의 사진 모음은 그룹 안에 남겨 뒀다**(#497). 그 화면은 반응형 시안이 없어 420px 기둥을 그대로 둔다 — 시안이 오면 라우트를 그룹 밖으로 옮기면서 격자 열 수와 이미지 `sizes`를 함께 정한다. 두 라우트가 만드는 주소가 달라(`/products/:id`와 `/products/:id/photos`) 서로 다른 그룹에 있어도 충돌하지 않는다.

**그사이 사진 모음이 `(member)` 안으로 더 들어갔다**(#542) — 지금 자리는 `(constrained)/(member)/products/[productId]/photos`다. 폭은 `(constrained)`를 그대로 물려받아 420px이고, 달라진 것은 **로그인을 요구한다**는 점이다(PM·PD가 "사진 전체보기"를 로그인 필요로 정했다). **상품 상세 본체는 공개 화면이라 두 그룹 어디에도 없다** — 같은 `/products/:id` 아래인데 부모와 자식이 다른 접근 정책을 갖는 자리다.

**옮기지 않는 것이 있다.**

- `api/` · `metrics/` · `firebase-messaging-sw.js` — route handler라 레이아웃과 무관하다
- `error.tsx` · `not-found.tsx` · `global-error.tsx` — 그룹 밖 루트에 두고 **폭과 높이를 각자 직접 가진다.** 그룹 안에 복제해도 그룹 레이아웃 자체에서 난 오류는 잡지 못한다(Next 문서: 같은 세그먼트의 `layout`은 감싸지 않는다)

## `(member)` 라우트 그룹

**로그인해야 열리는 화면을 모두 담는다**(#542). `(constrained)/(member)/layout.tsx`의 `SessionGuard`가 비로그인을 `/login`으로 보낸다. 비로그인은 메인·상품 상세·검색만 볼 수 있다(PM·PD, 2026-09-29) — 그 네 화면과 로그인·가입 흐름(`login`·`auth/callback`·`signup`), 개발용 `dev`만 그룹 밖에 있다.

- **새 화면은 기본적으로 이 그룹 안에 만든다.** 가드를 화면마다 두면 새 화면에서 빠뜨린다. 폴더 자리가 곧 보호 여부다.
- **같은 URL 줄기가 두 그룹에 나뉠 수 있다.** 상품 상세 `products/[productId]`는 공개라 밖에, 사진 모아보기 `products/[productId]/photos`는 안에 있다.
- proxy로 막지 않는다. 토큰이 메모리와 localStorage에 있어 서버가 볼 수 없다.
- 시안이 와서 `(constrained)` 밖으로 나가는 화면이 로그인을 요구하면, 루트에도 `(member)` 그룹을 두어 같은 가드를 씌운다.

## 의존 방향

모든 레이어를 import할 수 있다. 어떤 레이어도 `app`을 import하지 않는다.

## 주의

파일명은 Next.js 규약을 그대로 따른다. 이 레이어에서만 kebab-case 규칙의 예외가 적용된다.

라우트 세그먼트 폴더는 kebab-case로 만든다. 이 이름이 곧 URL이 된다.
