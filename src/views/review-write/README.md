# review-write

구매한 상품의 리뷰를 두 단계로 작성한다. 별점과 함께 아이의 실제 반응을 받는다.

- **라우트**: `/mypage/reviews/write?productId=&step=` — `src/app/mypage/reviews/write/page.tsx`
- **조립**: `entities/pet`(`PetSwitcher`·`useQueryPets`) · `entities/member`(`useQueryMyProfile`) · `entities/product`(`useQueryProductSummary`) · `entities/review`(`useMutateCreateReview`) · `shared/ui`의 `page-header` · `badge` · `rating` · `bottom-action-bar` · `input` · `textarea` · `button`
- **상태**: URL 쿼리 `productId`·`step`(rating · detail)과 작성 폼 상태. `productId`가 없으면 작성 화면 대신 나의 상품 후기로 안내한다. 아이 목록·닉네임·상품 요약은 서버 조회, 등록은 `entities/review`의 `useMutateCreateReview`
- **참고**: UI 시안 기준(리뷰작성 1884-29158·29400 1단계, 1884-29257·29325 2단계, 1884-29801 완료 — Figma에는 "타임딜"로 이름이 잘못 붙어 있다). 백엔드가 회원+상품당 리뷰 한 건만 받아 `productId`가 단위다

| 파일 | 설명 |
| --- | --- |
| `ui/review-write-view.tsx` | 두 단계 조립과 완료 화면. 1단계 별점·사용 기간·반응 5문항, 2단계 요약·아이(여러 마리)·급여 편의성·사진·후기. 완료의 "확인"은 `replace`로 가서 작성 화면이 히스토리에 남지 않는다(#371) |
| `ui/review-write-view.test.tsx` | 단계별 필수 조건, 반 개 별점, 요약 카드, 완료 화면 |
| `ui/product-row.tsx` | 리뷰를 다는 상품 줄. 사진 64 · 이름 · 재구매 배지 · 옵션. 옵션·재구매는 상품 요약 응답에 없어 비어 있다 |
| `ui/rating-input.tsx` | 별을 눌러 반 개 단위로 점수를 매긴다 |
| `ui/response-select.tsx` | 반응 한 문항. 붙은 세그먼트로 고른다 |
| `ui/photo-picker.tsx` | 사진을 최대 세 장 붙이고 뺀다. 더하는 칸은 시트를 열고, 사진첩·카메라 파일 입력 둘을 든다 |
| `ui/photo-source-sheet.tsx` | 사진첩·카메라를 고르는 시트(2729-101147). 줄을 누르면 바로 열리고 확인은 닫기만 한다 |
| `ui/photo-source-sheet.test.tsx` | 두 줄이 각자의 경로를 부르는지, 다 찼을 때 잠기는지 |
| `ui/photo-picker.test.tsx` | 장수 제한·빼기·미리보기 주소 정리, 시트 열기, 사진첩은 남고 카메라는 닫힘 |
| `model/questions.ts` | 반응 문항과 보기, 답한 것만 추리는 요약. 키와 값은 백엔드 `ReviewQuestionType`·`ReviewAnswer` |
| `model/to-create-request.ts` | 초안을 등록 요청으로 옮긴다. 답한 문항만 싣고 필수가 비면 `null` |
| `model/to-create-request.test.ts` | 값 변환과 필수가 빌 때 |
| `model/draft-storage.ts` | 작성 중인 값을 상품별로 기기에 남긴다. 등록하면 지운다 |
| `model/draft-storage.test.ts` | 되읽기, 항목별 분리, 깨진 값 버리기, 지우기 |
| `index.ts` | 공개 API |

## 짚어둘 것

**필수는 별점 · 사용 기간 · 아이 · 후기 글이고 반응 문항은 전부 선택이다.** 와이어프레임은 반응 3문항을 필수로 묶었는데 시안이 선택으로 바꿨다. 모르는 항목까지 아무 답이나 고르게 하면 추천 근거가 흐려진다. 어느 아이가 먹었는지는 여전히 필수다 — 아이를 모르면 그 답을 다음 추천에 쓸 수 없다. **아이는 여러 마리를 고른다**(#391) — 한 상품을 두 아이에게 함께 먹이는 일이 흔한데 리뷰는 회원+상품당 한 건이라, 한 마리만 실으면 나머지의 반응이 사라진다. 요청은 `petIds` 배열이고 한 마리 이상이면 된다. 옛 초안의 `petId` 하나는 배열로 읽는다. **다만 서버가 반응 문항을 하나 이상 요구한다**(`answerValues @NotEmpty`). 백엔드 확인이 올 때까지 등록 버튼이 하나는 받도록 막는다(#291).

**단계는 URL에, 입력값은 기기에 둔다.** 온보딩과 같은 판단으로 단계를 `push`해서 기기 뒤로가기가 1단계로 돌아오고, 별점·사용 기간·반응·아이·후기 글은 `localStorage`에 상품별로 남겨 2단계에서 새로고침해도 등록할 수 있다. 사진은 `File`이라 남기지 않는다. 등록을 마치면 지운다.

**별점은 반 개 단위다.** 시안이 4.5점을 그려 두었다. 별 하나(44px)를 좌우 22px로 갈라 라디오 열 개로 받고 화살표 키는 0.5씩 움직인다. 탭 크기는 시안 값을 그대로 쓴다는 규칙에 맞는다.

**반응 문항 세그먼트와 상품 줄은 이 화면에만 있어 여기 둔다.** `shared/ui/chip-select`는 떨어진 칩이라 시안(붙은 상자)과 다르다. 상품명은 시안이 15px semibold인데 토큰에 없어 `title/bold_16`을 쓴다.

**사진은 사진첩과 카메라 두 길로 받는다.** 더하는 칸을 누르면 "사진 첨부하기" 시트(2729-101147)가 뜨고 줄을 누르면 바로 그 경로가 열린다. 카메라는 `capture="environment"` 입력이라 WebView·모바일에서 촬영으로 바로 가고, 한 장 찍으면 시트가 닫힌다. 사진첩은 여러 장을 고를 수 있고 시트가 남아 이어서 고른다. "확인"은 닫기만 한다 — 시안의 라벨이 비어 있어 PD와 정했다. 데스크톱 브라우저는 `capture`를 무시해 둘 다 파일창이다. 합쳐서 세 장이고 다 차면 줄이 잠긴다.

**사진은 고르는 즉시 올리지 않고 파일만 들고 있는다.** 등록할 때 `useMutateCreateReview`가 `shared/api/upload-image`로 먼저 올리고 그 주소를 `images`에 싣는다. 훅 안에서 하므로 "등록하기"의 대기 표시가 업로드 시간까지 덮는다. 시안에는 빼는 버튼이 없지만 잘못 고른 사진을 되돌릴 길이 있어야 해 24px X를 둔다.

**등록되면 완료 화면으로 넘어간다.** 시안(1884-29801)대로 연한 브랜드 원 안의 체크와 "소중한 리뷰 감사해요!"이고, 확인을 누르면 작성한 리뷰 목록으로 간다. 실패하면 초안을 지우지 않고 그 자리에 남는다. 이미 쓴 상품(`ALREADY_REVIEWED`)과 구매 확정 전(`PURCHASE_NOT_CONFIRMED`)은 왜인지를 알린다.

**작성 화면으로 들어오는 실제 경로는 아직 없다.** 나의 상품 후기의 "작성 가능한 리뷰" 탭이 유일한 진입인데 그 목록 API가 백엔드에 없다. 백엔드에 요청해 뒀다(#291).
