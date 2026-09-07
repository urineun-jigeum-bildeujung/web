# search

상품을 검색한다. 최근 검색어와 카테고리 바로가기로 시작하고, 글자를 넣으면 추천어를 보인다.

- **라우트**: `/search` — `src/app/search/page.tsx`
- **조립**: `widgets/bottom-nav` · `shared/ui`의 `input` · `empty-state`
- **상태**: 입력한 글자와 최근 검색어 목록 모두 화면 안 상태. API 계약 확정 전 미연동
- **참고**: 와이어프레임 기준(검색 4화면). 추천어 목록은 목업이다. 검색하면 [search-result](../search-result/README.md)로 보낸다

| 파일 | 설명 |
| --- | --- |
| `ui/search-view.tsx` | 화면 조립 |
| `ui/search-view.test.tsx` | 기록 지우기·추천어 전환·중복 방지 |
| `ui/recent-keyword-chip.tsx` | 최근 검색어 한 칩. 누르면 검색, ×는 삭제 |
| `ui/suggestion-item.tsx` | 자동완성 한 줄. 입력한 글자를 강조한다 |
| `ui/suggestion-item.test.ts` | 강조할 구간을 나누는 규칙 |
| `model/recent-keywords.ts` | 최근 검색어를 기기에 읽고 쓴다 |
| `model/recent-keywords.test.ts` | 다섯 개 상한·재읽기·깨진 값 |
| `index.ts` | 공개 API |

## 짚어둘 것

**이 화면만 머리말에 `PageHeader`를 쓰지 않는다.** 제목 자리를 입력창이 차지하기 때문이다. `PageHeader`는 가운데 제목을 전제로 3열 그리드를 잡아서 맞지 않는다.

**들어오면 입력창에 바로 초점을 준다.** 검색하러 온 화면인데 한 번 더 눌러 입력을 시작하게 만들지 않는다.

**최근 검색어 칩은 버튼 두 개를 나란히 둔다.** 칩 안에 삭제 버튼을 겹쳐 넣으면 눌리지 않고, 탭 영역이 겹치면 지우려다 검색된다. `shared/ui/filter-chips`는 하나를 고르는 칩이라 여기 쓰지 않는다 — 기준은 [component-convention](../../../docs/conventions/component-convention.md)의 "공용으로 올리는 기준"을 본다.

**최근 검색어는 `useSyncExternalStore`로 잇는다.** 저장소는 React 밖의 것이라, 효과 안에서 `setState`로 되읽으면 React Compiler가 연쇄 렌더로 잡는다. 서버 스냅숏을 따로 주어 프리렌더된 HTML과 첫 그림이 어긋나지 않게 한다.

**IA가 최근 검색어를 최대 5개로 못 박고 있다.** 상한이 없으면 화면 절반이 최근 검색어가 된다.

**추천어 강조는 색만으로 하지 않는다.** `<strong>`으로 굵기를 함께 줘서 색을 구분하기 어려운 사람도 어느 부분이 겹쳤는지 안다.

## 아직 정하지 않은 것

**추천어를 무엇으로 채울지 정해지지 않았다.** 지금은 목업 목록에서 입력한 글자가 들어간 것을 고른다. 기획 확정 후 서버에서 받는다.

**최근 검색어를 서버에 둘지 기기에 둘지 정해지지 않았다.** 지금은 기기(`localStorage`)에 남긴다. API 계약이 정해지면 `model/recent-keywords.ts` 하나만 갈아끼우면 되도록 읽고 쓰는 자리를 모아 뒀다.
