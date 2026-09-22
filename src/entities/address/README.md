# entities/address

배송 받을 곳. 마이페이지의 배송지 화면과 결제 흐름이 함께 쓴다.

**`views/` 안이 아니라 여기 있는 이유**는 세 슬라이스(`views/edit-address` · `views/checkout` · `views/addresses`)가 같은 것을 쓰기 때문이다. `views/` 안에 두면 같은 레이어 간 참조라 막힌다 (AGENTS.md 4절).

**목록 화면도 여기 있다.** 결제의 배송지 설정(`/payment/address`)과 마이페이지의 배송지 관리(`/mypage/address`)가 같은 목록을 그린다. 둘 다 `views/`라 한쪽에 두면 다른 쪽이 못 본다 (#329).

| 파일 | 설명 |
| --- | --- |
| `api/addresses.ts` | 배송지 조회·등록·수정·삭제 요청 함수와 `Address`·`SaveAddressRequest` 타입 |
| `api/addresses.test.ts` | 무엇을 어떤 모양으로 보내는지, 기본 배송지 정렬 |
| `api/use-query-addresses.ts` | 목록을 가져오는 훅 |
| `api/use-mutate-address.ts` | 등록·수정 훅. 실패 토스트는 전역에 맡긴다 |
| `ui/address-place-list.tsx` | 장소 목록과 "장소 추가하기". 두 화면이 함께 쓴다. `from`으로 등록·수정을 마치고 돌아올 경로를 받는다 (#369) |
| `ui/address-place-list.test.tsx` | 무엇을 어떤 차례로 그리는지, 실패·빈 상태 |
| `ui/place-icon.ts` | 장소 이름으로 아이콘을 고르는 표 |
| `model/group-addresses.ts` | 기본 배송지를 맨 앞에 두는 묶음 계산 |

## 알아둘 것

**배송지를 고르는 API는 없다.** `/payment/address`는 목록에서 하나를 골라 `addressId`를 주문 생성(`POST /orders`)에 넘긴다. 서버에 "지금 고른 배송지" 같은 상태는 없다.

**집·회사는 서버에 없는 개념이다.** 종류를 내려주지 않으므로 아이콘은 화면이 `addressName`으로 고른다.

**`deliveryNote`만 nullable이다.** 나머지는 등록할 때 빈 값으로 보내면 안 된다.

**삭제는 함수만 있고 부르는 화면이 없다.** 지우는 자리가 `/mypage/address`인데 그 화면은 PD 시안 대기다.
