# views/edit-pet

아이 정보를 항목별로 고치는 세 화면.

- **라우트**: `/mypage/pets/basic` · `/mypage/pets/body` · `/mypage/pets/health` — `src/app/mypage/pets/{basic,body,health}/page.tsx`
- **조립**: `entities/pet`의 `BreedPickerStep` · `SizeGuide` · `BodyTypeGuide` · `BodyTypeSlider` · `HealthPickerField`, `shared/ui`의 `page-header` · `bottom-action-bar` · `avatar-uploader`(`size="lg"`) · `form-field` · `chip-select` · `checkbox-row`
- **상태**: 입력값은 화면 안 상태. 품종 고르기는 URL 쿼리 `picking`
- **참고**: UI 시안 기준(정보 수정 기본 `1555-49797` · 체형 `1507-43555` · 건강 `1507-43640`)

| 파일 | 설명 |
| --- | --- |
| `ui/edit-pet-screen.tsx` | 세 화면이 공유하는 골격. 머리말 "정보 수정"과 하단 "수정완료" |
| `ui/edit-pet-basic-view.tsx` | 사진·이름·종·나이·성별·중성화 |
| `ui/edit-pet-body-view.tsx` | 체구·몸무게·체형 |
| `ui/edit-pet-health-view.tsx` | 걱정되는 질환·알러지 |
| `ui/edit-pet-health-view.test.tsx` | 무엇을 답으로 세는지, 해당 없음이 고르기를 잠그는지 본다 |
| `index.ts` | 공개 API |

## 온보딩과 무엇이 다른가

입력 항목은 온보딩(`onbo_002`~`onbo_004`)과 같지만 화면 구성이 다르다.

| | 온보딩 | 정보 수정 |
| --- | --- | --- |
| 머리말 | 진행 표시 | 뒤로가기 + "정보 수정" |
| 하단 | 이전 / 다음 단계 작성하기 | 수정완료 하나 |
| 묶음 | `onbo_002`·`onbo_003`으로 나뉨 | 기본 정보 한 화면에 모임 |

그래서 단계 컴포넌트를 그대로 쓰지 않고 입력 요소만 재사용한다.

**건강 정보는 온보딩과 같은 것으로 고른다.** 자유 입력이면 보호자마다 다르게 적어 같은 질환이 여러 표기로 쌓이고, 그 값으로는 추천을 만들 수 없다. 고르는 자리는 `entities/pet`의 `HealthPickerField`이고 온보딩 건강 단계가 같은 것을 쓴다.

## 아직 없는 것

저장된 값이 목 데이터다.

품종은 `?picking=breed`로 같은 화면 안에서 고른다. 별도 라우트로 나가면 이 화면이 언마운트되어 입력하던 이름·나이·성별이 전부 저장값으로 되돌아간다. 온보딩이 단계를 쿼리로 넘기는 것과 같은 이유다. 목록을 그리는 `BreedPickerStep`은 `entities/pet`에 있어 온보딩과 함께 쓴다.
