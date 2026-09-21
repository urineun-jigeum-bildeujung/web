# views/edit-pet

아이 정보를 항목별로 고치는 세 화면.

- **라우트**: `/mypage/pets/basic` · `/mypage/pets/body` · `/mypage/pets/health` — `src/app/mypage/pets/{basic,body,health}/page.tsx`
- **조립**: `entities/pet`의 `BreedPickerStep` · `SizeGuide` · `BodyTypeGuide` · `BodyTypeSlider` · `HealthPickerField`, `shared/ui`의 `page-header` · `bottom-action-bar` · `avatar-uploader`(`size="lg"`) · `form-field` · `chip-select` · `checkbox-row`
- **상태**: 저장된 값은 서버 상태(TanStack Query), 고치는 값은 화면 안 상태. 어느 아이인지와 품종 고르기는 URL 쿼리 `petId`·`picking`
- **참고**: UI 시안 기준(정보 수정 기본 `1555-49797` · 체형 `1507-43555` · 건강 `1507-43640`)

| 파일 | 설명 |
| --- | --- |
| `model/use-edit-pet.ts` | 셋이 함께 쓰는 자리. 고칠 아이를 정하고 상세를 받아 저장까지 잇는다 |
| `ui/edit-pet-screen.tsx` | 세 화면이 공유하는 골격. 머리말 "정보 수정"과 하단 "수정완료" |
| `ui/edit-pet-status.tsx` | 받는 중에는 골격을, 못 받았을 때는 까닭을 보인다 |
| `ui/edit-pet-skeleton.tsx` | 저장된 값을 기다리는 동안 잡아 둘 자리. 라우트의 `Suspense` fallback도 이것이다 |
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

## 어느 아이를 고치는지 쿼리로 받는다

라우트가 `/mypage/pets/basic`처럼 아이를 가리지 않는다. 아이 관리 카드의 화살표가 `?petId=`를 실어 보낸다(#268). 없으면 고칠 아이를 모르므로 그 사실을 알리고 저장을 막는다.

`useQueryState`를 쓰게 되어 **세 라우트를 `Suspense`로 감싼다.** 감싸지 않으면 정적 프리렌더가 실패하는데 **빌드에서만 드러난다**. fallback은 `EditPetSkeleton`이라 쿼리를 읽기 전과 상세를 받는 중이 같은 모양이다.

**`?petId=`처럼 비어 있는 것도 없는 것과 같이 본다.** 한 번 고르고 조회·저장·판정이 같은 값을 쓴다 — 가르지 않으면 조회는 꺼져 있는데 안내는 안 뜨는 상태가 생긴다.

## 값이 도착한 뒤에 폼을 마운트한다

효과 안에서 `setState`로 채우면 React가 연쇄 렌더로 잡고(`react-hooks/set-state-in-effect`), 아이를 바꿨을 때 옛 값이 남을 여지도 생긴다. 상세를 받기 전에는 골격과 안내만 그리고, 받은 뒤 `key={pet.id}`로 폼을 새로 띄운다.

## 한 번 적은 생일은 지울 수 없다

서버가 `null`을 "안 고침"으로 읽는다(`birthDate != null ? birthDate : this.birthDate`). 빈 칸으로 보내도 옛 값이 그대로 남으므로, **지운 줄 알게 두는 것보다 못 지우게 막는 편이 낫다**(#268 리뷰). 비우면 입력칸 아래에 그 사실을 알리고 저장을 막는다. 삭제가 필요해지면 백엔드가 먼저 그 뜻을 받아야 한다.

## 고치는 것만 보낸다

`PATCH /members/me/pets/{petId}`는 전 필드가 선택이다. 체형 화면이 이름·나이까지 실으면 **고치지도 않은 값을 덮어쓴다.** 화면마다 자기가 맡은 필드만 담는다.

**빈 배열은 "해당 없음"으로 답한 것이다.** 안 고른 것과 없다고 답한 것을 서버가 가리지 못해, 건강 화면은 비어 있으면 체크가 켜진 것으로 읽는다.

## 아직 없는 것

사진. `image`는 presigned로 올린 URL을 실어 보내는데 그 흐름은 별도 이슈다(#269).

아이 삭제. `DELETE /members/me/pets/{petId}`가 있지만 **시안에 지우는 자리가 없다.** 되돌릴 수 없는 동작이라 진입점과 확인 절차를 PD와 정해야 한다.

품종은 `?picking=breed`로 같은 화면 안에서 고른다. 별도 라우트로 나가면 이 화면이 언마운트되어 입력하던 이름·나이·성별이 전부 저장값으로 되돌아간다. 온보딩이 단계를 쿼리로 넘기는 것과 같은 이유다. 목록을 그리는 `BreedPickerStep`은 `entities/pet`에 있어 온보딩과 함께 쓴다.
