# views/home

메인 화면. 와이어프레임 `메인` 계열 여섯 장에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/home-view.tsx` | 메인 (`메인`, `메인_사료 탭`, `메인_타임딜 없을 때`) |
| `ui/home-view.test.tsx` | 탭에 따라 화면이 바뀌는지, 상태 체크가 무엇을 약속하는지 본다 |
| `model/category.ts` | 카테고리 탭 값·라벨·백엔드 `CategoryCode` 매핑·정규화. 서버 페이지(`page.tsx`)도 같이 써서 `"use client"`가 아닌 이 파일에 둡니다 |
| `model/category.test.ts` | 정규화·카테고리 매핑을 봅니다 |
| `model/sort.ts` | 정렬 값·라벨·백엔드 `ProductSort` 매핑·정규화 |
| `index.ts` | 공개 API |

## 라우트

```text
/?category=all|food|snack|supplement&sort=<정렬>
```

## 탭에 따라 화면이 통째로 다르다

- **전체** — 골라주는 화면이다. 프로모션 배너, 아이 고르기, 맞춤 상품, 상태 체크, 타임딜
- **사료·간식·영양제** — 2열 상품 격자와 정렬

같은 화면의 필터가 아니라 다른 구성이라 조건부로 나눠 그린다.

## 가로 목록은 캐러셀이 아니다

맞춤 상품·상태 체크·타임딜은 손으로 밀어서 넘긴다. 저절로 넘어가지 않는다 — 디자인팀이 정한 것이다. 읽는 도중에 내용이 바뀌면 방해가 된다.

`shared/ui/scroll-row`를 쓴다. 목록 자체에 `tabIndex`를 주지 않는다. 칸 안이 모두 링크라 Tab으로 넘어가면 브라우저가 그 자리로 스크롤한다.

## 상태 체크가 이 서비스의 핵심이다

"최근에 구매한 상품, 소리는 어때요?"에서 반응을 받아 다음 추천에 반영한다. 시트 마지막에 **"소리의 다음 추천 적합도에 반영할게요"**를 적는 것은 그 약속을 보이게 하기 위해서다.

"아직 판단하기에는 일러요"도 답으로 받는다. 억지로 고르게 하면 값이 흐려진다.

## 주황은 임시다

시안의 주황은 브랜드 컬러가 아니다. `--brand` 토큰 한 곳에 담아 두었으므로 색이 정해지면 `globals.css`의 그 두 줄만 갈아끼운다.

## 개발용 화면 목록은 옮겼다

메인이 `/`를 차지하면서 만들어 둔 화면 목록은 `/dev/screens`로 갔다. 자리 표시 화면이 남아 있는 동안은 그 목록으로 확인하는 편이 빠르다.

## 카테고리 그리드·타임딜 미리보기는 실제 API로 연동했다(#289)

`app/page.tsx`가 서버에서 `entities/product`의 `getProducts`·`getTimeDeals("ACTIVE")`를 조회해 Promise로 넘기고, `home-view.tsx`의 `ProductGrid`·`TimeDealPreview`가 각각 `use()`+`Suspense`로 그 결과만 대기합니다. "더 보기"는 브라우저에서 같은 `getProducts`를 커서로 이어 부릅니다.

**정렬 UI를 백엔드 5종(`RECOMMEND`·`POPULAR`·`REVIEW`·`PRICE_ASC`·`PRICE_DESC`)에 맞춰 바꿨습니다.** 기존 목업엔 최신순·별점순이 있었지만, Figma("메인_사료 탭_드롭다운")를 직접 확인해 보니 펼쳐진 옵션 목록 자체가 시안에 없고 닫힌 상태("추천순")만 있었습니다 — 근거 없이 채워져 있던 목업이라 백엔드 계약값으로 교체했습니다(`search-result`와 같은 5개 값).

**카테고리 매핑은 API 계층이 아니라 `model/category.ts`가 합니다.** `entities/product/api/products.ts`의 `getProducts`는 백엔드 `CategoryCode`(`FOOD`·`TREAT`·`SUPPLEMENT`)만 받습니다 — API 함수가 화면의 URL 값(`food`·`snack`·`supplement`)을 알면 API 계층이 화면 상태에 결합되기 때문입니다. `snack→TREAT`는 단순 대문자 변환이 아닙니다(`CategoryCode.java`로 직접 확인).

**정가·적합도 배지는 카테고리 그리드에서 뺐습니다.** 실제 `ProductCardResponse`엔 정가·적합도(matchScore) 필드가 없습니다(`search-result`와 같은 공백). Figma 시안(1758-69075)은 취소선 정가를 보여주는데 백엔드엔 없습니다 — 제품 정책 확인 후 백엔드에 필드 추가를 요청할 수 있는 후보로 남깁니다.

**"AI가 골라주는 맞춤 상품" 캐러셀은 이번 라운드에 연동하지 않았습니다.** `petId`를 백엔드가 받기만 하고 실제 조회에 반영하지 않고(`ProductListCriteria`에 필드 자체가 없음), `RECOMMEND` 정렬도 `POPULAR`와 완전히 같은 동작이라(`resolveEffectiveSort()`) 개인화가 실제로 동작하지 않습니다 — `/recommendations`와 같은 이유로 제외했습니다. 재연동 조건은 후속 이슈로 남깁니다.

## 아직 없는 것

- 배너가 한 장이다. 점은 여럿임을 알리는 자리로만 그렸고 넘기지는 못한다
- "AI가 골라주는 맞춤 상품" 캐러셀이 목업입니다 — `/recommendations`와 함께 개인화 계약이 갖춰지면 후속 이슈로 연동합니다
- 정가(취소선 원가) 표시가 없습니다 — `ProductCardResponse`에 필드가 없어서입니다
- 배포 환경변수(`API_BASE_URL_INTERNAL`)는 로컬 값만 확인했습니다. 실제 GitOps 주입은 별도 확인이 필요합니다
