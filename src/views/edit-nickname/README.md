# views/edit-nickname

닉네임 변경. 한 항목만 받아 저장한다.

- **라우트**: `/mypage/info/nickname` — `src/app/mypage/info/nickname/page.tsx`
- **조립**: `shared/ui`의 `single-input-screen` · `form-field`(밑줄형)
- **상태**: 입력값은 화면 안 상태
- **참고**: UI 시안 기준(`mypa_111`, `1482-28361`·`1482-28634`)

| 파일 | 설명 |
| --- | --- |
| `ui/edit-nickname-view.tsx` | 닉네임 변경 |
| `index.ts` | 공개 API |

## 아직 없는 것

API 연동. 화면 안의 값은 확인용 목 데이터이며 백엔드 계약이 정해지면 교체한다.
