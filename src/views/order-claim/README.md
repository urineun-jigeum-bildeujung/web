# order-claim

배송이 끝난 주문에서 **반품·교환을 신청하는 화면.** ① 상품 고르기 → ② 사유·사진 → ③ 수거·안내의 세 단계다. 유형은 라우트가 아니라 `type` 쿼리로 구분한다.

- **라우트**: `/mypage/orders/[orderId]/claim` — `src/app/mypage/orders/[orderId]/claim/page.tsx`
- **상태**: URL 쿼리 `type` (`return` · `exchange`)과 `step` (`items` · `reason` · `pickup`, `history: push`). 고른 상품·수량, 사유, 사진, 상세 사유, 수거 희망일·요청사항은 `OrderClaimView`의 `useState`

| 파일 | 설명 |
| --- | --- |
| `ui/order-claim-view.tsx` | 신청 화면. 조회·차단 판단·단계 전환·접수를 조립한다 |
| `ui/order-claim-view.test.tsx` | 서버 조건을 화면이 먼저 막는지, 단계를 넘기며 고르고 적은 것이 그대로 실려 나가는지 본다 |
| `ui/claim-items-step.tsx` | ① 상품 고르기. 전체선택과 상품 카드 |
| `ui/claim-item-card.tsx` | ①의 상품 카드 한 장. 고르면 주황 테두리, 신청할 수 없으면 흐리게 |
| `ui/claim-reason-step.tsx` | ② 사유. 상품 수량, 사유 보기 다섯과 사진 첨부, 상세 사유 |
| `ui/claim-photo-picker.tsx` | 사진 세 장까지 붙이고 빼기. 파일은 위로 넘기고 접수할 때 올린다 |
| `ui/claim-pickup-step.tsx` | ③ 수거. 수거 희망일·안내·요청사항, 반품은 환불 안내·교환은 교환 상품 안내 |
| `ui/claim-section.tsx` | ②·③의 흰 카드 한 장. 제목 옆에 필수·선택 뱃지 |
| `lib/use-object-urls.ts` | 사진 미리보기 주소(blob:)를 만들고 거두는 훅. 개발 모드 StrictMode에서도 쓰는 주소를 거두지 않게 `useSyncExternalStore`로 든다 (#409 리뷰) |
| `lib/use-object-urls.test.ts` | 만든 주소를 거두는지, StrictMode가 effect를 다시 돌려도 쓰는 주소가 살아 있는지 |
| `model/claim-steps.ts` | 세 단계와, 지금 값으로 그릴 수 있는 단계(`reachableStep`) |
| `model/claim-steps.test.ts` | 값이 비면 앞 단계로 당기는지 |
| `model/claim-selection.ts` | 고른 상품과 수량, 전체선택. 신청 진행 여부 판정은 `entities/order`에 있다 |
| `model/claim-selection.test.ts` | 선택 토글·전체선택과 요청 모양 |
| `model/claim-reasons.ts` | 사유 보기 다섯. 이름이 서버 사유 코드이고 문구는 시안 그대로다 (#417) |
| `model/pickup-dates.ts` | 수거 희망일 보기 둘. 한국 날짜로 내일부터, 일요일은 건너뛴다 |
| `model/pickup-dates.test.ts` | 한국 날짜로 세는지, 일요일을 건너뛰는지 |
| `model/refund-estimate.ts` | 반품 환불 예상 금액. 상품 금액 − 반품비 3,000원 |
| `model/refund-estimate.test.ts` | 시안 예와 같은 값을 내는지 |
| `model/to-claim-request.ts` | 모은 값을 접수 요청으로. 사유는 코드로 싣고, 서버에 필드가 없는 값은 사유 글에 묶는다 |
| `model/to-claim-request.test.ts` | 사유 코드가 실리는지, 줄마다 빠짐없이 실리는지, 서버 한도 1,000자 안에 드는지 |
| `index.ts` | 공개 API |

## 서버와 주고받는 것

```text
GET  /orders/{orderId}                 신청할 상품을 고르려고 주문을 받는다
POST /orders/images/presigned-url      사진마다 업로드 주소를 받는다 { extension } → { uploadUrl, fileUrl }
PUT  {uploadUrl}                       S3에 바로 올린다 (x-amz-tagging: status=pending)
POST /orders/{orderId}/claims          { claimType, reason, items: [{ orderItemId, quantity }], imageUrls? }
```

**규격은 로컬 백엔드 소스에서 옮겼다** (`order-service`의 `adapter/in/web/claim`·`adapter/in/web/image`). 명세 화면에 이 엔드포인트 행이 없어 `CreateClaimRequest`·`CreateClaimService`·`OrderImageController`·`Order.java`를 직접 읽었다 (#327, #408).

**사진은 접수 버튼을 누를 때 올린다.** 올리는 일은 접수 훅(`entities/order`의 `useMutateClaim`)이 맡는다 — 리뷰 등록과 같은 이유로, 화면이 따로 올리면 버튼 대기 표시가 업로드 시간을 덮지 못하고 실패가 전역 알림으로 가지 않는다. 사진이 없으면 `imageUrls`를 빼고 보낸다.

## 서버가 거는 조건

| 조건 | 화면이 하는 것 |
| --- | --- |
| 배송완료 + 7일 이내 | 둘 다 화면에서 막는다. `deliveredAt`으로 `isWithinClaimPeriod`가 판정하고, 서버 `Order.isClaimableForReturn`과 같은 규칙이다 (#374) |
| 품목마다 진행 중인 신청 없음 | 진행 중인 상품은 ①에서 **흐리게 두고 고를 수 없게** 한다. 하나만 걸려도 **요청 전체**가 거절된다. 전체선택도 그 상품을 건너뛴다 |
| 수량 ≤ 남은 수량 | ②의 스테퍼가 `effectiveQuantity`를 상한으로 둔다. 남은 수량이 0인 상품은 ①에서 흐리게 둔다 (#374) |
| 같은 품목 중복 금지 | 선택을 `orderItemId → 수량` 표로 들어 중복이 생기지 않는다 |
| 사유 1000자 이하 | 사유 글이 넘지 않게 상세 사유 300자·요청사항 100자로 막는다 |
| 사진 소유 확인 | 우리가 올린 파일만 싣는다. 걸리면(`ORDER_403_FORBIDDEN_IMAGE`) "사진을 다시 골라" 문구로 알린다 |

**진행 중인지는 `claimStatus`로 본다.** 백엔드 `ClaimStatus.terminalStates()`가 `COMPLETED`·`REJECTED` 둘을 끝으로 보므로 나머지 셋(`REQUESTED`·`COLLECTING`·`INSPECTING`)이 진행 중이다.

## 시안 (2026-09-23 PD 완성본)

| 단계 | 시안 | 바탕·머리말 |
| --- | --- | --- |
| ① 상품 고르기 | `mypa_261_반품상품선택` `3333:36951`·`37027`, `mypa_261_교환상품선택` `3333:36989`·`37065` | 흰색, "주문 내역" |
| ② 사유 | `mypa_261_반품 신청` `3333:37513`·`37439`, `mypa_262_교환신청` `3333:37587`·`37668` | 회색, "반품 신청"·"교환 신청" |
| ③ 수거 | `mypa_361` `3324:38820`·`38944`, `mypa_362` `3324:38896`·`39019` | 회색, 같음 |

PD와 맞춘 것 — 교환에서 옵션 고르기·옵션 줄을 뺐다. 교환 안내 문구는 "상태 확인이 끝나면 새 상품을 보내드릴게요". 반품 ②의 첫 카드 제목은 교환과 같이 "반품할 상품"(시안은 "상품을 선택해주세요"), 교환 ①의 고르기 전 버튼은 "교환 신청하기"(시안은 "반품 신청하기")로 맞췄다 — PD 승인(2026-09-23).

**수거 희망일 칸의 날짜는 시안의 예시 값이다.** 안내 문구가 "1~2일 안에 기사님이 수거"라 내일·모레를 보이고, 택배가 쉬는 일요일은 건너뛴다.

## 사유는 코드로, 서버에 필드가 없는 값은 사유 글에 묶는다

**고른 사유 보기는 `reasonCode`로 간다. 필수다**(`@NotBlank`) — 빠지면 본문 검증에서 400이다. 백엔드가 보기 다섯의 이름(`CHANGE_OF_MIND`·`DAMAGED`·`WRONG_ITEM`·`NOT_AS_DESCRIBED`·`OTHER`)을 그대로 `ClaimReasonCode`로 받고, 맞지 않는 값은 `ORDER_400_INVALID_CLAIM_REASON_CODE`로 막는다(백엔드 #141, #417). 화면의 보기 표(`CLAIM_REASON_LABEL`)가 서버 코드와 어긋나면 타입 오류가 난다. 그 오류 코드는 문구에 잇지 않았다 — 늘 다섯 중 하나만 보내 사용자가 볼 일이 없다.

**상세 사유·수거 희망일·수거 요청사항은 서버에 필드가 없다.** 백엔드가 수거 필드는 만들지 않기로 해서(2026-09-23) 줄마다 머리글을 달아 `reason`(자유 문자열)에 싣는다. 비어 있는 선택 항목은 줄째 뺀다. 사유 보기는 코드로 가므로 글에 다시 쓰지 않는다.

```text
[상세 사유] 포장이 찢어져 있었어요
[수거 희망일] 2026-09-24
[수거 요청사항] 문 앞에 두었어요
```

## 환불 예상은 화면 계산이다

③의 환불 안내는 상품 금액(개당 금액 × 신청 수량)에서 반품비 3,000원을 뺀 값이다. 배송비는 0원이고 사유와 관계없이 같다 — 모두 시안 값이다. **서버는 반품비를 모르고, 반품이 끝나도 환불을 일으키지 않는다**(결제 취소로 이어지는 것은 주문 취소 하나뿐). 환불 수단 자리는 결제상세와 같은 토스페이 로고다.

## 기능명세서와 다른 것

| `MYPA_261` | 이번 구현 | 까닭 |
| --- | --- | --- |
| 사유 라디오 넷 | 시안의 보기 다섯 | 시안이 "상품 설명과 달라요"를 더했다. 서버에는 코드(`reasonCode`)로 간다 |
| 유형 드롭다운 | 진입 쿼리로 고정 | 주문 상세 확인창이 이미 유형을 정해 보낸다. 드롭다운이면 같은 것을 두 번 고르게 된다 |

## 취소는 이 화면을 거치지 않는다

기능정의서와 유즈케이스는 취소도 "유형=취소"로 이 화면에 오게 적어 두었지만, **시안(`mypa_061`)과 IA는 목록의 취소 모달에서 끝낸다.** 백엔드도 그 기준으로 `POST /orders/{orderId}/cancel`에 요청 본문을 두지 않았다(2026-09-21 회신).

**PD팀도 같은 날 확정해 줬다** — "취소 버튼 → 모달 → 취소버튼 클릭 시 취소"이고 **"사유를 적는 건 반품과 환불만"**이다. 추측이 아니라 확정이다.

**`ClaimType.CANCEL`을 보내지 않는다.** 클레임은 배송완료 주문만 받으므로 취소를 이 경로로 보내면 늘 `ORDER_409_NOT_CLAIMABLE`이다. `type=cancel`로 들어오면 유형을 모른다고 알리고 주문 상세로 돌려보낸다.

## 새로고침과 뒤로가기

단계는 주소에 `push`로 쌓여 기기 뒤로가기로 이전 단계에 간다. 입력값은 화면 상태라 새로고침하면 사라지는데 주소의 단계는 남는다 — 그대로 그리면 고른 상품 없이 접수 버튼이 서므로 `reachableStep`이 값이 있는 단계까지 당기고 주소도 `replace`로 맞춘다.

접수하면 주문 상세로 `replace`한다. 그 앞의 단계 이력은 남아, 상세에서 뒤로가기를 누르면 신청 화면 첫 단계가 다시 열린다 — 방금 신청한 상품은 흐리게 서 있어 두 번 보낼 수는 없다.
