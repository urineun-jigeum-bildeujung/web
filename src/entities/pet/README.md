# entities/pet

반려동물을 표현하는 것들. 이 서비스의 중심 엔티티다.

| 파일 | 설명 |
| --- | --- |
| `ui/body-type-guide.tsx` | 체형(BCS)이 무엇인지 알려주는 물음표와 설명 모달 (`onbo_003_bcs툴팁`) |
| `ui/body-type-guide.test.tsx` | 다섯 단계가 이름만이 아니라 설명까지 읽히는지 본다 |
| `ui/breed-picker.tsx` | 종별로 나눈 품종 선택 목록 |
| `ui/breed-picker-step.tsx` | 품종 고르기 화면. 온보딩과 정보 수정이 함께 쓴다 |
| `ui/breed-picker-step.test.tsx` | 고른 값이 종과 함께 넘어가는지 본다 |
| `ui/pet-switcher.tsx` | 아이 고르기 줄. 마지막 칸은 새 아이 자리. `withNames`로 이름을 함께 보인다 |
| `ui/product-feedback-sheet.tsx` | 산 제품이 아이에게 맞았는지 묻는 시트 (`메인_상태 체크 바텀시트`) |
| `ui/product-review-sheet.tsx` | 아이가 먹은 제품의 후기 시트 (`mypa_021_상품클릭시`) |
| `model/breeds.ts` | 품종 목록, 성별·중성화·체구 선택지, 체형 다섯 단계와 설명, 프로필 초안 타입 |
| `ui/health-picker-sheet.tsx` | 건강 관심사·알러지 성분을 탭으로 나눠 고르는 시트 (`onbo_004_바텀`) |
| `model/health.ts` | 질환·성분 목록. **더미이며 기획 확정 후 교체** |
| `index.ts` | 공개 API |

## 아직 없는 것

조회 훅(`api/`)은 백엔드 API 계약이 정해진 뒤에 만든다. 품종 목록도 지금은 시안에 적힌 값을 상수로 두었고, 서버에서 받아오는 것으로 바뀔 수 있다.

`PetProfileSelector`(아바타로 반려동물 전환)는 마이페이지 작업에서 만든다.

**시안 기준 주의** — 체구 선택지가 견종 기준 문구(소형견·중형견·대형견)다. 고양이는 표현이 달라야 할 수 있어 PD팀 확인이 필요하다.
