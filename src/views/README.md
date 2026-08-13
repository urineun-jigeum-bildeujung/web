# views 레이어

FSD 표준의 **pages 레이어**다. 라우트 하나에 대응하는 화면을 조립한다.

> **이름이 `views`인 이유** — Next.js는 `src/pages/`를 Pages Router로 인식해 App Router와 충돌한다. 그래서 FSD 표준 이름을 쓸 수 없다. 되돌리지 않는다.

## 담는 것

- 라우트 1:1 화면 컴포넌트. `widgets`·`features`·`entities`를 배치해 한 화면을 완성한다.
- 그 화면에서만 쓰는 레이아웃 구성.

## 담지 않는 것

- 재사용되는 UI 블록 → `widgets`
- 사용자 행동 단위 로직 → `features`
- 도메인 모델 → `entities`

## 의존 방향

`widgets` · `features` · `entities` · `shared`를 import할 수 있다. `app`은 import하지 않는다.

`app/**/page.tsx`가 이 레이어의 컴포넌트를 불러 쓴다.

## 구조

```
views/
└── subscription-detail/
    ├── ui/
    └── index.ts
```

바깥에서는 `index.ts`가 노출한 것만 import한다.
