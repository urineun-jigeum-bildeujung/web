# views/edit-nickname

닉네임 변경. 한 항목만 받아 저장한다.

- **라우트**: `/mypage/info/nickname` — `src/app/mypage/info/nickname/page.tsx`
- **조립**: `entities/member`의 조회·수정 훅, `shared/ui`의 `single-input-screen` · `form-field`(밑줄형)
- **상태**: 입력값은 화면 안 상태. 지금 닉네임은 서버 상태(TanStack Query)
- **참고**: UI 시안 기준(`mypa_111`, `1482-28361`·`1482-28634`)

| 파일 | 설명 |
| --- | --- |
| `ui/edit-nickname-view.tsx` | 닉네임 변경 |
| `index.ts` | 공개 API |

## 짚어둘 것

**지금 닉네임은 초기값이 아니라 자리 표시다.** 시안(`1482-28361`)이 입력칸을 비워 두고 회색 글자로만 보인다. 조회한 값을 `placeholder`에 넣는 이유다.

**닉네임만 보낸다.** `PATCH /members/me`는 전 필드가 선택이라, 이름·생년월일까지 실으면 이 화면이 고치지도 않은 값을 덮어쓴다 (#266).
