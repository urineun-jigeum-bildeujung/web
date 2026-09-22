# views/edit-address

배송지 추가·수정 화면. UI 시안 `mypa_311_미입력`, `mypa_311`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/edit-address-view.tsx` | 배송지 추가·수정 |
| `ui/edit-address-view.test.tsx` | 주소창이 가리키는 값이 채워지는지, 고른 주소가 들어오는지 |
| `model/address-form-schema.ts` | 폼 검증 규칙. 서버 제약을 옮겨 둔 zod 스키마 |
| `index.ts` | 공개 API |

## 라우트

`/mypage/address/new` — `src/app/mypage/address/new/page.tsx`

## 주소는 어디서 오는가

이 화면에서 직접 적지 않는다. `받을 곳 주소` 줄은 입력칸이 아니라 `/mypage/address/search`로 가는 링크이고, 검색 화면이 고른 주소를 `?roadAddr=`·`?zipNo=`에 실어 돌려보낸다.

**도로명과 우편번호는 짝으로 움직인다.** `zipCode`가 등록 필수인데 폼에 칸이 없어, 새로 고른 도로명에 저장돼 있던 옛 우편번호를 붙이면 아무도 눈치채지 못한 채 배송이 엉뚱한 곳으로 간다. 한쪽만 바꾸지 않는다.

컴포넌트 상태로 들지 않은 이유는 검색 화면으로 넘어가는 순간 사라지기 때문이다. URL에 두면 새로고침과 뒤로가기에서도 살아남는다 (AGENTS.md 5.1).

## 폼은 react-hook-form이 든다

`AGENTS.md` 기술 스택 표가 폼에 `react-hook-form`·`zod`를 적어 두었는데 저장소 어디에서도 쓰이지 않고 있었다. 이 화면이 그 규칙을 처음 따르는 곳이다 (#355).

검증 규칙은 `model/address-form-schema.ts` 한 곳에 있다. **서버 `AddressRegisterRequest`의 `@NotBlank` 넷을 그대로 옮긴 것**이라, 그전처럼 저장 버튼 잠금 조건에 손으로 늘어놓지 않는다. 상세주소가 필수인 줄 모르고 빠뜨려 저장이 400으로 막힌 적이 있다 (#314).

`FormField`·`CheckboxRow`는 제어 컴포넌트라 `Controller`로 잇는다.

**잠금 판정에 `formState.isValid`를 쓰지 않는다.** resolver 검증이 비동기라 한 박자 늦게 따라와, 마지막 칸을 채운 직후에도 버튼이 잠겨 보인다. 같은 스키마로 `watch()` 값을 그 자리에서 `safeParse`한다.

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

## 아직 없는 것

**삭제.** 지우는 자리가 `/mypage/address`인데 그 화면은 PD 시안 대기다. `entities/address`에 함수만 있다.
