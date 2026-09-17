# widgets/bottom-nav

화면 하단에 고정되는 전역 이동 줄. UI 시안 `1758-68976` 기준이다.

| 파일 | 설명 |
| --- | --- |
| `ui/bottom-nav.tsx` | 홈·상품비교·좋아요·마이페이지 네 항목. 현재 경로를 표시한다 |
| `ui/bottom-nav.test.tsx` | 현재 경로의 탭에 aria-current가 붙는지 확인 |
| `index.ts` | 공개 API |

## 경로

네 항목 모두 `src/views/README.md`의 라우팅 구조를 따른다. 홈(`/`)·상품비교(`/compare`)·좋아요(`/likes`)·마이페이지(`/mypage`) 전부 실제 화면으로 연결되어 있다.
