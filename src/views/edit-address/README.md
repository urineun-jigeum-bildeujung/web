# views/edit-address

배송지 추가·수정 화면. UI 시안 `mypa_311_미입력`, `mypa_311`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/edit-address-view.tsx` | 배송지 추가·수정 |
| `ui/edit-address-view.test.tsx` | 주소창이 가리키는 값이 채워지는지, 고른 주소가 들어오는지 |
| `model/address-form-schema.ts` | 폼 검증 규칙. 서버 제약을 옮겨 둔 zod 스키마 |
| `model/address-draft.ts` | 적다 만 폼 값을 탭 안에서 들고 있는다 |
| `model/address-draft.test.ts` | 대상이 다른 것, 절반만 적은 것, 막힌 저장소 |
| `model/return-to.ts` | 저장을 마치고 돌아갈 곳. 우리 경로만 통과시킨다 |
| `model/return-to.test.ts` | 바깥을 가리키는 값, 탭·줄바꿈으로 감춘 값 |
| `index.ts` | 공개 API |

## 라우트

`/mypage/address/new` — `src/app/mypage/address/new/page.tsx`

## 주소는 어디서 오는가

이 화면에서 직접 적지 않는다. `받을 곳 주소` 줄은 입력칸이 아니라 `/mypage/address/search`로 가는 링크이고, 검색 화면이 고른 주소를 `?roadAddr=`·`?zipNo=`에 실어 돌려보낸다.

**도로명과 우편번호는 짝으로 움직인다.** `zipCode`가 등록 필수인데 폼에 칸이 없어, 새로 고른 도로명에 저장돼 있던 옛 우편번호를 붙이면 아무도 눈치채지 못한 채 배송이 엉뚱한 곳으로 간다. 한쪽만 바꾸지 않는다.

컴포넌트 상태로 들지 않은 이유는 검색 화면으로 넘어가는 순간 사라지기 때문이다. URL에 두면 새로고침과 뒤로가기에서도 살아남는다 (AGENTS.md 5.1).

## 적다 만 값은 어떻게 살아남는가

**주소 검색이 별도 라우트라 다녀오면 폼이 언마운트된다.** 고른 주소는 주소창에 실려 오지만 이름·연락처는 컴포넌트 상태라 사라졌다. 새 배송지는 반드시 검색을 거치므로 **주소보다 이름을 먼저 적은 사람은 매번 다시 적어야 했다** (#370).

`model/address-draft.ts`가 `sessionStorage`에 들고 있는다. 주소창에 싣지 않는 것은 이름·연락처가 개인정보이기 때문이다.

| 언제 | 무엇 |
| --- | --- |
| 주소 검색 링크를 누를 때 | 지금 값을 적어 둔다. 떠나기 직전이 마지막 기회다 |
| 검색을 다녀왔을 때(`roadAddr`가 있을 때) | 되살린다. 그냥 다시 들어온 경우는 되살리지 않는다 — 지웠다고 생각한 값이 돌아온다 |
| 저장에 성공했을 때 | 비운다 |

**대상(`place`)이 같을 때만 되살린다.** `집`을 고치다 나가서 새 배송지를 넣으면 집 값이 새 폼에 들어찬다.

**되살리기는 렌더가 아니라 마운트 뒤에 한다.** `sessionStorage`는 서버에 없어, 렌더 중에 읽으면 서버가 그린 빈 칸과 어긋나 하이드레이션에서 깨진다.

## 폼은 react-hook-form이 든다

`AGENTS.md` 기술 스택 표가 폼에 `react-hook-form`·`zod`를 적어 두었는데 저장소 어디에서도 쓰이지 않고 있었다. 이 화면이 그 규칙을 처음 따르는 곳이다 (#355).

검증 규칙은 `model/address-form-schema.ts` 한 곳에 있다. **서버 `AddressRegisterRequest`의 `@NotBlank` 넷을 그대로 옮긴 것**이라, 그전처럼 저장 버튼 잠금 조건에 손으로 늘어놓지 않는다. 상세주소가 필수인 줄 모르고 빠뜨려 저장이 400으로 막힌 적이 있다 (#314).

`FormField`·`CheckboxRow`는 제어 컴포넌트라 `Controller`로 잇는다.

**잠금 판정에 `formState.isValid`를 쓰지 않는다.** resolver 검증이 비동기라 한 박자 늦게 따라와, 마지막 칸을 채운 직후에도 버튼이 잠겨 보인다. 같은 스키마로 `useWatch({ control })`이 준 값을 그 자리에서 `safeParse`한다. `watch()`가 아닌 이유는 렌더마다 새 함수라 React Compiler가 메모이제이션을 포기하기 때문이다(`react-hooks/incompatible-library`).

## 무엇을 보내는가

`entities/address`의 `useMutateAddress`를 쓴다 (#237). `place`가 있으면 그 `addressId`를 고치고, 없으면 새로 등록한다.

| 폼 | API |
| --- | --- |
| 배송지 이름 | `addressName` |
| 받는 분 이름 | `receiver` |
| 연락처 | `phone` |
| 받을 곳 주소 | `address` · `zipCode`(주소창에서 함께 온다) |
| 상세 주소 | `addressDetail` |
| 배송 요청사항 | `deliveryNote` — **적지 않으면 빈 문자열이 아니라 `null`이다.** 명세에서 유일한 nullable |
| 계속 이 주소로 받을게요 | `isDefault` |

**고칠 대상이 있으면 목록을 기다린 뒤에 폼을 그린다.** 빈 폼을 먼저 그리면 값이 나중에 들어오면서 사용자가 적던 것을 덮는다.

**저장이 끝난 뒤에 떠난다.** 먼저 떠나면 실패했을 때 적은 것이 사라진다. 실패 문구는 `MutationCache.onError`가 전역으로 띄운다.

## 저장하면 어디로 가는가

`?from=`이 가리키는 곳으로 `replace`한다. 없으면 `router.back()`이다.

**`router.back()` 하나로는 못 돌아간다.** 주소는 검색 화면에서만 고르는데, 그 화면의 쪽 이동이 `history: "push"`라 넘긴 만큼 항목이 쌓인다. 저장 뒤 한 칸 되돌리면 방금 떠난 검색 화면이고, 몇 칸인지 셀 수도 없다. 주소를 검색해 고르는 등록은 전부 여기 해당했다 (#369).

그래서 들어온 화면이 자기 경로를 `from`에 실어 보내고, 검색 화면은 `place`처럼 그것도 그대로 돌려준다.

| 들어온 곳 | `from` |
| --- | --- |
| 배송지 관리 | `/mypage/address` |
| 결제 배송지 설정 | `/payment/address` |
| 결제 화면 (배송지 없음) | `/payment?items=…` — 고른 것을 들고 간다 |

**주소창에 실려 오는 값이라 그대로 믿지 않는다.** `?from=https://…`로 고쳐 두면 저장을 마친 사용자를 바깥으로 보내게 된다. `toInternalPath`가 우리 경로 하나만 통과시킨다.

## 아직 없는 것

**삭제.** 지우는 자리가 `/mypage/address`인데 그 화면은 PD 시안 대기다. `entities/address`에 함수만 있다.
