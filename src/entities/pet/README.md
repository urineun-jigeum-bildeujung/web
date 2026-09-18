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
| `ui/breed-picker.test.tsx` | 종별 묶음·검색·같은 이름을 id로 가르기 |
| `ui/breed-picker-step.tsx` | 품종 고르기 화면. 머리말·검색창·목록. 줄을 누르면 바로 확정. 온보딩과 정보 수정이 함께 쓴다 |
| `ui/breed-picker-step.test.tsx` | 두 종을 각각 불러 합치는지, 검색·불러오는 중·실패 |
| `api/breeds.ts` | 품종 조회 요청 함수와 `Breed`·`SpeciesBreed` 타입 |
| `api/use-query-breeds.ts` | 강아지·고양이를 함께 받아 한 목록으로 펴는 훅 |
| `api/pets.ts` | 내 아이 목록·상세 조회와 `PetListItem`·`PetDetail` 타입 |
| `api/pets.test.ts` | 무엇을 부르는지, 기본 아이 정렬, enum을 화면 값으로 옮기는 것 |
| `api/use-query-pets.ts` | 아이 목록을 가져오는 훅 |
| `api/use-query-pet-detail.ts` | 고른 아이의 상세를 가져오는 훅 |
| `ui/pet-switcher.tsx` | 아이 고르기 줄(기본 48px, `variant="main"` 60px, `variant="hero"`는 고른 아이만 90px). 마지막 칸은 새 아이 자리. `withNames`로 이름을 보인다 (`mypa_021`, 리뷰 작성, 메인 홈화면) |
| `ui/product-feedback-sheet.tsx` | 산 제품이 아이에게 맞았는지 묻는 시트 (`mypa_021` 반응 시트). 메인의 상태 체크도 같은 것이다 |
| `model/breeds.ts` | 성별·중성화·체구 선택지, 체형 다섯 단계와 설명, 프로필 초안 타입, 종 파라미터 |
| `model/health.test.ts` | 고른 코드를 표시명으로 되돌리는 변환 |
| `ui/health-picker-sheet.tsx` | 건강 관심사·알러지 성분을 탭으로 나눠 고르는 시트 (`onbo_004_바텀`) |
| `ui/health-picker-field.tsx` | 그 시트를 여는 자리. 고른 것을 칩으로 되보인다 (`onbo_004`·`mypa_321`) |
| `model/health.ts` | 고르는 항목과 묶음의 타입. 목록은 서버가 준다 |
| `api/health-options.ts` | 건강 고민·알레르기 조회와 화면 모양으로 옮기는 변환 |
| `api/health-options.test.ts` | 종 파라미터, 대분류 옮기기, 알레르기 코드·표시명 |
| `api/use-query-health-options.ts` | 고른 종의 선택지를 받는 훅 |
| `index.ts` | 공개 API |

## 아직 없는 것

`PetProfileSelector`(아바타로 반려동물 전환)는 마이페이지 작업에서 만든다.

**체구 문구는 UI 시안에서 소형·중형·대형으로 확정됐다.** 와이어프레임의 견종 기준 문구(소형견 등)는 쓰지 않는다. 몇 kg으로 가르는지는 `SIZE_GUIDE`에 있고 `SizeGuide` 말풍선이 보인다.

**질환 갈래는 종별로 다르다.** 서버가 종에 맞춰 걸러 준다 — 고양이에게 `십자인대 질환`을, 강아지에게 `헤어볼`을 보이면 "우리 아이 기준"이라는 전제가 무너진다. 알레르기도 마찬가지라 고양이 전용 `BONITO`, 강아지 전용 `INSECT` 같은 코드가 있다. **종이 바뀌면 앞서 고른 것을 비워야 한다** — 새 종에 없는 코드를 등록 요청에 실어 보내게 된다.

**품종은 서버가 준 id로 다룬다.** 등록 API(`POST /members/me/pets`)가 이름이 아니라 `breedId`를 받는다. 그래서 목록을 하드코딩할 수 없고 `GET /pets/breeds`로 받는다. 초안에는 `breedId`와 함께 화면에 보일 `breedName`을 둔다 — 목록을 다시 받기 전에도 고른 품종이 보여야 한다.

**종을 되찾는 함수가 필요 없어졌다.** "기타"가 양쪽 목록에 다 있어 이름만으로는 어느 종인지 가릴 수 없었고, 그래서 `findSpecies(breed, hint)`를 두고 있었다. id는 종마다 다르므로 그 모호함이 사라진다.

**품종 목록은 받아오는 중에 줄 자리를 잡는다.**(#238) 문구 한 줄만 두면 검색창 아래가 비었다가 갑자기 수십 줄로 차서 화면이 튄다.

**품종 조회를 두 번 부른다.** API가 `species`를 필수로 받는데 품종 화면은 두 종을 한 번에 보이고 검색도 양쪽을 훑는다. 종마다 캐시가 따로 잡혀 한쪽이 실패해도 다른 쪽은 살아 있다.

**고른 값을 그대로 찍지 않는다.** 저장은 코드로 하므로 목록에서 표시명을 되찾아 보인다. 그대로 찍으면 `CHICKEN`이 화면에 뜬다. 되찾는 자리는 `model/health.ts`의 `toLabels`다. 고르는 자리(`HealthPickerField`)는 선택지를 손에 들고 있어 바로 쓴다.

**상세 조회는 알레르기를 코드로만 준다.** `GET /members/me/pets/{petId}`의 `allergies`가 `CHICKEN` 배열이다. **받은 코드를 그대로 보인다** — 백엔드가 상세에도 `displayName`을 실어 주기로 했으므로, 그때까지 선택지를 따로 받아 짝을 맞추지 않는다(#230). 곧 사라질 우회를 위해 화면마다 요청이 한 번 더 나가고 그 화면이 종까지 알아야 하기 때문이다. `healthConcerns`는 코드 자리에 한글이 들어 있어 그대로 쓴다.

**아이 목록은 순서를 보장하지 않는다.** 백엔드 `findByMemberId`에 `ORDER BY`가 없어 순서가 DB에 달렸다. 전환 줄은 순서가 흔들리면 눌렀던 자리가 매번 달라지므로 `isDefault`를 앞으로 올려 `api/pets.ts`에서 정렬한다.

**알레르기만 코드 체계다.** 서버가 `{ code, displayName }`을 주므로 화면에는 표시명을 보이고 저장은 코드로 한다. 표시명이 바뀌어도 저장된 값이 깨지지 않는다(#123). 건강 고민은 한글 문자열 그대로 주고받아 비대칭인데, 백엔드에 확인을 요청해 두었다(#226).

**알레르기는 묶음이 하나다.** 서버가 평평한 목록으로 주는데 시트는 묶음 단위로 그린다. 한 묶음으로 싸서 넘기고, 갈래가 하나뿐일 때는 탭 줄을 그리지 않는다 — 고를 것이 없는 탭은 자리만 차지하고 스크린 리더에도 탭으로 읽힌다.
