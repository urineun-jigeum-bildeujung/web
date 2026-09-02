# views/edit-pet

아이 정보를 항목별로 고치는 세 화면. 와이어프레임 `mypa_121`·`mypa_221`·`mypa_321`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/edit-pet-screen.tsx` | 세 화면이 공유하는 골격. 헤더와 하단 완료 버튼 |
| `ui/edit-pet-basic-view.tsx` | 사진·이름·견종·나이·성별·중성화 (`mypa_121`) |
| `ui/edit-pet-body-view.tsx` | 체구·몸무게·체형 (`mypa_221`) |
| `ui/edit-pet-health-view.tsx` | 염려질환·알러지 (`mypa_321`) |
| `ui/edit-pet-health-view.test.tsx` | 무엇을 답으로 세는지, 해당 없음이 입력을 잠그는지 본다 |
| `index.ts` | 공개 API |

## 온보딩과 무엇이 다른가

입력 항목은 온보딩(`onbo_002`~`onbo_004`)과 같지만 화면 구성이 다르다.

| | 온보딩 | 정보 수정 |
| --- | --- | --- |
| 헤더 | 닫기 + 진행 표시 | 뒤로가기 + "정보 수정" |
| 하단 | 이전 / 다음 단계 작성하기 | 수정 완료 하나 |
| 묶음 | `onbo_002`·`onbo_003`으로 나뉨 | `mypa_121` 한 화면에 모임 |

그래서 단계 컴포넌트를 그대로 쓰지 않고 입력 요소만 재사용한다.

## 라우트

```text
/mypage/pets/basic    mypa_121
/mypage/pets/body     mypa_221
/mypage/pets/health   mypa_321
```

**경로는 임시다.**

## 아직 없는 것

저장된 값이 목 데이터다.

품종은 `?picking=breed`로 같은 화면 안에서 고른다. 별도 라우트로 나가면 이 화면이 언마운트되어 입력하던 이름·나이·성별이 전부 저장값으로 되돌아간다. 온보딩이 단계를 쿼리로 넘기는 것과 같은 이유다. 목록을 그리는 `BreedPickerStep`은 `entities/pet`에 있어 온보딩과 함께 쓴다.
