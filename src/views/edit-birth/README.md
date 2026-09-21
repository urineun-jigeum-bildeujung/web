# views/edit-birth

생년월일 변경. 한 항목만 받아 저장한다.

- **라우트**: `/mypage/info/birth` — `src/app/mypage/info/birth/page.tsx`
- **조립**: `entities/member`의 조회·수정 훅, `shared/ui`의 `single-input-screen` · `form-field`(밑줄형)
- **상태**: 입력값은 화면 안 상태. 지금 값은 서버 상태(TanStack Query)
- **참고**: 시안이 따로 없어 닉네임 변경(`mypa_111`)과 같은 골격으로 맞췄다

| 파일 | 설명 |
| --- | --- |
| `ui/edit-birth-view.tsx` | 생년월일 변경 |
| `index.ts` | 공개 API |

## 짚어둘 것

**지금 값은 초기값이 아니라 자리 표시다.** 닉네임 변경과 같다 — 입력칸을 비워 두고 회색 글자로만 보인다.

**생년월일 만 보낸다.** `PATCH /members/me`는 전 필드가 선택이라, 다른 값까지 실으면 이 화면이 고치지도 않은 것을 덮어쓴다 (#278).

**치는 대로 `0000. 00. 00`으로 맞춘다.** 아이 생일 입력과 같은 규칙이라 `shared/lib/birth-date`에 함께 둔다. 여덟 자를 다 쳤는데 달력에 없는 날이면 알리고 저장을 막는다 — 그대로 보내면 서버가 `LocalDate`로 읽지 못해 본문을 통째로 거절한다.
