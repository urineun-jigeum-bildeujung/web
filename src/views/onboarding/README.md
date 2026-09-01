# views/onboarding

반려동물 프로필을 등록하는 온보딩 화면. 와이어프레임 `onboarding (완료)` 섹션에 대응한다.

**체구를 고르면 몸무게와 체질 항목이 그 자리에 나타난다.** 시안이 `onbo_003_체구선택전`과 `체구선택후` 두 장으로 나뉘어 있는 이유다.

| 파일 | 설명 |
| --- | --- |
| `ui/onboarding-view.tsx` | 단계 이동과 입력값 보관. 각 단계를 갈아 끼운다 |
| `ui/steps/intro-step.tsx` | 도입부. 건너뛰기 / 프로필 입력하기 (`onbo_001`) |
| `ui/steps/basic-step.tsx` | 사진·이름·성별·중성화 (`onbo_002`) |
| `ui/steps/detail-step.tsx` | 품종·나이·체구, 체구 선택 후 몸무게·체질 (`onbo_003_체구선택전`·`체구선택후`) |
| `ui/steps/breed-step.tsx` | 품종 선택 하위 화면 (`onbo_013_품종선택`) |
| `ui/steps/health-step.tsx` | 염려질환·알러지 (`onbo_004`) |
| `ui/steps/done-step.tsx` | 완료 (`onbo_005`) |
| `model/steps.ts` | 단계 목록과 진행 표시 계산 |
| `index.ts` | 공개 API |

## 라우트

`/onboarding` — `src/app/onboarding/page.tsx`

UCS의 최초 서비스 소개와 IA의 프로필 등록 온보딩 정의가 달라 화면 개념은 PM·PD 확인이 필요하다. 현재 `/onboarding`은 반려동물 프로필 등록 흐름으로 사용한다.

## 상태를 어디에 두었나

| 대상 | 위치 | 이유 |
| --- | --- | --- |
| 현재 단계 | URL 쿼리 `?step=` | 새로고침·뒤로가기에서 살아남아야 한다 |
| 입력값 | 컴포넌트 상태 | 시안의 이탈 모달이 "저장되지 않아요"라고 알린다 |

`@use-funnel`을 검토했지만 쓰지 않았다. `@use-funnel/next`의 `useNextRouter`가 `next/router`(Pages Router)를 반환해 App Router에서 동작하지 않는다. 이미 도입한 `nuqs`로 같은 일이 되고 "새로고침에 남아야 하는 상태는 URL"이라는 규칙과도 맞는다.

**진행 표시는 입력 단계 셋만 센다.** 도입부·품종 선택·완료를 넣으면 사용자가 보는 진행률이 실제와 어긋난다.

## 아직 없는 것

프로필 저장 API 연동. 백엔드 계약이 정해지면 `done` 단계 진입 전에 붙인다. 지금은 마지막 단계에서 바로 완료 화면으로 넘어간다.
