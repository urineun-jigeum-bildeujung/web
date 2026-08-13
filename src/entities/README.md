# entities 레이어

**비즈니스 엔티티**다. 이 서비스가 다루는 명사들이 온다.

## 담는 것

- 반려동물(pet), 상품(product), 구독(subscription), 주문(order), 리뷰(review), 사용자(user)
- 각 엔티티의 타입, 표현 컴포넌트(카드·요약), 조회 훅

## 담지 않는 것

- 상태를 바꾸는 행동 → `features`
- 여러 엔티티를 조합한 화면 블록 → `widgets`

## 판단 기준

이름이 **명사**이고 서비스 도메인에서 실체를 가리키면 entity다. 백엔드의 도메인 모델과 대체로 1:1로 대응한다.

## 의존 방향

`shared`만 import할 수 있다. 상위 레이어는 import하지 않는다.

같은 레이어의 다른 entity도 import하지 않는다. 엔티티 간 조합이 필요하면 상위 레이어(`features`·`widgets`)에서 한다.

## 구조

```
entities/
└── pet/
    ├── ui/      # PetCard 등 표현 컴포넌트
    ├── model/   # 타입, 순수 로직
    ├── api/     # 조회 훅 (use-query-*)
    └── index.ts
```
