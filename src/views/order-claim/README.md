# order-claim

배송이 끝난 주문에서 **반품·교환을 신청하는 화면.** 유형은 라우트가 아니라 `type` 쿼리로 구분한다.

- **라우트**: `/mypage/orders/[orderId]/claim` — `src/app/mypage/orders/[orderId]/claim/page.tsx`
- **상태**: URL 쿼리 `type` (`return` · `exchange`), 고른 상품·수량과 사유는 화면 안의 `useState`

| 파일 | 설명 |
| --- | --- |
| `ui/order-claim-view.tsx` | 신청 화면. 조회·차단 판단·접수를 조립한다 |
| `ui/claim-item-row.tsx` | 상품 한 줄. 체크와 수량 조절 |
| `ui/order-claim-view.test.tsx` | 서버 조건을 화면이 먼저 막는지, 고른 것이 그대로 실려 나가는지 본다 |
| `model/claim-selection.ts` | 고른 상품과 수량. 신청 진행 여부 판정은 `entities/order`에 있다 |
| `model/claim-selection.test.ts` | 선택 토글과 요청 모양 |
| `index.ts` | 공개 API |

## 서버와 주고받는 것

```text
GET  /orders/{orderId}          신청할 상품을 고르려고 주문을 받는다
POST /orders/{orderId}/claims   { claimType, reason?, items: [{ orderItemId, quantity }] }
```

**규격은 로컬 백엔드 소스에서 옮겼다** (`order-service`의 `adapter/in/web/claim`). 명세 화면에 이 엔드포인트 행이 없어 `CreateClaimRequest`·`CreateClaimService`·`Order.java`를 직접 읽었다 (#327).

## 서버가 거는 조건

| 조건 | 화면이 하는 것 |
| --- | --- |
| 배송완료 + 7일 이내 | 둘 다 화면에서 막는다. `deliveredAt`으로 `isWithinClaimPeriod`가 판정하고, 서버 `Order.isClaimable`과 같은 규칙이다 (#374) |
| 품목마다 진행 중인 신청 없음 | 진행 중인 상품을 목록에서 뺀다. 하나만 걸려도 **요청 전체**가 거절된다 |
| 수량 ≤ 남은 수량 | `effectiveQuantity`를 상한으로 둔다. 남은 수량이 0인 줄은 목록에서 뺀다 (#374) |
| 같은 품목 중복 금지 | 선택을 `orderItemId → 수량` 표로 들어 중복이 생기지 않는다 |
| 사유 1000자 이하, 선택 | `maxLength`로 막고, 안 쓰면 보내지 않는다 |

**진행 중인지는 `claimStatus`로 본다.** 백엔드 `ClaimStatus.terminalStates()`가 `COMPLETED`·`REJECTED` 둘을 끝으로 보므로 나머지 셋(`REQUESTED`·`COLLECTING`·`INSPECTING`)이 진행 중이다.

## 시안이 없다

**이 화면은 Figma에 없다.** 2026-09-21에 파일 전체를 검색해 `사유`·`단순변심`이 0건인 것을 확인했다. 2026-09-18 답은 "우선순위 낮음"이었는데 **2026-09-21 회신에서 "아직 디자인 되지 않은 화면은 내일부터 작업해 전달"로 바뀌었다.** 곧 온다. 주문 상세(`mypa_161`)와 같은 골격(회색 바닥 + 흰 카드)으로 맞추고 디자인 토큰만 썼다. **시안이 오면 교체 대상이다.**

기능명세서 `MYPA_261`과 셋이 다르고 까닭은 모두 서버가 받는 모양에 있다.

| `MYPA_261` | 이번 구현 | 까닭 |
| --- | --- | --- |
| 사유 라디오 (단순변심·상품 하자/불량·배송 지연·기타) | 여러 줄 입력 | 서버가 받는 것은 자유 문자열 하나다. **사유 코드 체계가 없어** 라디오로 만들면 화면 문구를 그대로 문자열로 보내게 된다 |
| 사진 최대 3장 | 없음 | **클레임용 presigned URL 엔드포인트가 없다.** 있는 것은 회원 프로필과 리뷰 둘뿐이고, 리뷰용을 빌려 쓰면 저장 위치와 수명 관리가 어긋난다 |
| 유형 드롭다운 | 진입 쿼리로 고정 | 주문 상세 확인창이 이미 유형을 정해 보낸다. 드롭다운이면 같은 것을 두 번 고르게 된다 |

## 취소는 이 화면을 거치지 않는다

기능정의서와 유즈케이스는 취소도 "유형=취소"로 이 화면에 오게 적어 두었지만, **시안(`mypa_061`)과 IA는 목록의 취소 모달에서 끝낸다.** 백엔드도 그 기준으로 `POST /orders/{orderId}/cancel`에 요청 본문을 두지 않았다(2026-09-21 회신).

**PD팀도 같은 날 확정해 줬다** — "취소 버튼 → 모달 → 취소버튼 클릭 시 취소"이고 **"사유를 적는 건 반품과 환불만"**이다. 추측이 아니라 확정이다.

**`ClaimType.CANCEL`을 보내지 않는다.** 클레임은 배송완료 주문만 받으므로 취소를 이 경로로 보내면 늘 `ORDER_409_NOT_CLAIMABLE`이다. `type=cancel`로 들어오면 유형을 모른다고 알리고 주문 상세로 돌려보낸다.

## 백엔드에 요청해 둘 것

- **클레임 사진용 presigned URL 엔드포인트** — 없으면 `imageUrls`를 채울 방법이 없다
- **사유 코드 체계** — 기능명세서의 라디오 네 개를 살릴지, 자유 문자열로 갈지
