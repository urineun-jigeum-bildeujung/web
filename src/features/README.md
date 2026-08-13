# features 레이어

**사용자가 하는 행동** 단위다. 대체로 상태를 바꾸는 것(폼 제출, mutation, 토글)이 여기 온다.

## 담는 것

- 리뷰 작성, 구독 주기 변경, 장바구니 담기, 필터 적용, 로그인
- 그 행동에 필요한 폼·검증 스키마·mutation 훅

## 담지 않는 것

- 도메인 데이터의 표현과 조회 → `entities`
- 여러 feature를 묶은 완결된 블록 → `widgets`

## 판단 기준

이름을 **동사구**로 지을 수 있으면 feature다 (`write-review`, `change-cycle`). 명사면 entity일 가능성이 높다.

## 의존 방향

`entities` · `shared`를 import할 수 있다. `widgets` · `views` · `app`은 import하지 않는다.

같은 레이어의 다른 feature도 import하지 않는다. 두 feature가 서로를 필요로 하면 경계가 잘못 그어진 것이다.

## 구조

```
features/
└── write-review/
    ├── ui/      # 폼 컴포넌트
    ├── model/   # 타입, zod 스키마, 상태
    ├── api/     # mutation 훅
    └── index.ts
```
