# entities/pet

반려동물을 표현하는 것들. 이 서비스의 중심 엔티티다.

| 파일 | 설명 |
| --- | --- |
| `ui/body-type-guide.tsx` | 체형(BCS)이 무엇인지 알려주는 물음표와 설명 시트 (`onbo_003_bcs툴팁`) |
| `ui/body-type-icon.tsx` | 체형 다섯 단계의 강아지 실루엣. 시안 자산을 currentColor로 옮겼다 |
| `ui/body-type-slider.tsx` | 체형을 고르는 슬라이더와 눈금 문구 (`onbo_003_체구선택후`). 온보딩·체형 수정이 함께 쓴다 |
| `ui/body-type-slider.test.tsx` | 손잡이 값이 숫자가 아니라 체형 이름으로 읽히는지 본다 |
| `ui/size-guide.tsx` | 체구를 몇 kg으로 가르는지 보이는 물음표 말풍선 (`onbo_003_체구툴팁`) |
| `ui/body-type-guide.test.tsx` | 다섯 단계가 이름만이 아니라 설명까지 읽히는지 본다 |
| `ui/breed-picker.tsx` | 품종 목록. 검색 전에는 종별 전체, 검색 중에는 걸러진 것 (`onbo_011_품종선택`) |
| `ui/breed-picker.test.tsx` | 종별 묶음·검색·기타 구분 |
| `ui/breed-picker-step.tsx` | 품종 고르기 화면. 머리말·검색창·목록. 줄을 누르면 바로 확정. 온보딩과 정보 수정이 함께 쓴다 |
| `ui/breed-picker-step.test.tsx` | 검색이 목록을 거르고 줄을 누르면 종과 함께 넘어가는지 본다 |
| `ui/pet-switcher.tsx` | 아이 고르기 줄. 마지막 칸은 새 아이 자리. `withNames`로 이름을, `variant="hero"`로 고른 아이를 96px로 보인다 (`mypa_021`) |
| `ui/product-feedback-sheet.tsx` | 산 제품이 아이에게 맞았는지 묻는 시트 (`mypa_021` 반응 시트). 메인의 상태 체크도 같은 것이다 |
| `model/breeds.ts` | 품종 목록, 성별·중성화·체구 선택지, 체형 다섯 단계와 설명, 프로필 초안 타입 |
| `model/breeds.test.ts` | 품종으로 종을 되찾는 규칙과 목록 개수 |
| `model/health.test.ts` | 질환 갈래가 종별로 갈리는지 |
| `ui/health-picker-sheet.tsx` | 건강 관심사·알러지 성분을 탭으로 나눠 고르는 시트 (`onbo_004_바텀`) |
| `ui/health-picker-field.tsx` | 그 시트를 여는 자리. 고른 것을 칩으로 되보인다 (`onbo_004`·`mypa_321`) |
| `model/health.ts` | 질환·성분 목록. **더미이며 기획 확정 후 교체** |
| `index.ts` | 공개 API |

## 아직 없는 것

조회 훅(`api/`)은 백엔드 API 계약이 정해진 뒤에 만든다. 품종 목록도 지금은 시안에 적힌 값을 상수로 두었고, 서버에서 받아오는 것으로 바뀔 수 있다.

`PetProfileSelector`(아바타로 반려동물 전환)는 마이페이지 작업에서 만든다.

**체구 문구는 UI 시안에서 소형·중형·대형으로 확정됐다.** 와이어프레임의 견종 기준 문구(소형견 등)는 쓰지 않는다. 몇 kg으로 가르는지는 `SIZE_GUIDE`에 있고 `SizeGuide` 말풍선이 보인다.

**품종은 기능명세서 v0.4의 `데이터 구조`가 정본이다.** 시안이 아니다. 강아지 35 · 고양이 23이고 표기까지 그대로 맞춘다 — 표기가 다르면 서버가 내려주는 값과 대조가 안 된다.

**`기타`는 강아지·고양이 양쪽 목록에 다 있다.** 이름만으로는 종을 가를 수 없어 `findSpecies(breed, hint)`에 프로필의 종을 넘긴다. 넘기지 않으면 고양이로 저장한 `기타`가 강아지로 뒤집힌다.

**질환 갈래는 종별로 다르다.** 기능명세서 v0.4 `데이터 구조`가 정본이고 강아지 11갈래 · 고양이 12갈래다. `CONCERN_GROUPS[species]`로 꺼내 쓴다 — 고양이에게 `십자인대 질환`을, 강아지에게 `헤어볼`을 보이면 "우리 아이 기준"이라는 전제가 무너진다.

**알러지는 아직 더미다.** 확정 데이터가 코드 체계(`CHICKEN`·`WHEAT_GLUTEN`)라 문자열로 옮기면 계약이 정해질 때 다시 만든다.
