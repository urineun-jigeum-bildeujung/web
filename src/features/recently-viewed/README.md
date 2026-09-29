# features/recently-viewed

최근 본 상품을 이 브라우저에 기록한다. **백엔드에 최근 본 상품 API가 없다**(2026-09-29 Notion API 명세 77줄·백엔드 소스 확인). 팀장 결정으로 프론트가 Zustand `persist`(localStorage)로 남긴다 (#509).

| 파일 | 설명 |
| --- | --- |
| `index.ts` | 공개 API — `useRecentlyViewedStore`·`useRecentlyViewed`·`useRecordRecentlyViewed`·`RECENTLY_VIEWED_LIMIT` |
| `model/recently-viewed-store.ts` | 상품 번호 목록 스토어. 최신순, 최대 9개, 다시 보면 앞으로 옮긴다 |
| `model/recently-viewed-store.test.ts` | 순서·중복·상한·빼기·저장과 복원, 깨진 저장 값, 저장을 막은 브라우저 |
| `model/use-recently-viewed.ts` | 목록을 읽는 훅. 하이드레이션이 끝나기 전에는 `ready`가 거짓이고 빈 목록이다 |
| `model/use-record-recently-viewed.ts` | 상품 상세가 들어올 때 그 상품을 남기는 훅 |
| `model/use-recently-viewed.test.tsx` | 서버 렌더에서 빈 목록, 브라우저에서 저장된 목록, 빼기, 기록 |

## 짚어둘 것

**상품 번호만 남긴다.** 이름·가격 같은 서버 값은 복사하지 않는다 — 가격이 바뀌어도 옛 값이 남고 캐시 무효화가 깨진다(AGENTS 5.1). 그리는 쪽이 `entities/product`의 `useQueryProductDetails`로 받는다.

**서버에서는 목록을 모른다.** 서버에는 localStorage가 없어 서버 HTML은 늘 빈 목록이다. 브라우저의 스토어는 만들 때 바로 복원되므로, 그대로 그리면 서버 HTML과 어긋난다. `useRecentlyViewed`는 `useSyncExternalStore`의 서버 스냅숏(`false`)으로 하이드레이션을 그린 뒤 바로 저장된 목록으로 다시 그린다.

**저장을 막은 브라우저에서도 화면은 돈다.** 사이트 데이터 차단이면 localStorage를 읽기만 해도, 용량이 차면 쓸 때 예외가 난다. 그대로 두면 상품 상세가 기록하다 죽으므로 읽고 쓰는 자리를 감싸 예외를 삼킨다. 기록만 남지 않는다. 저장된 값은 통째로 펼치지 않고 양의 정수만 골라 중복을 없애고 9개로 자른다(code-convention "React 밖의 것 읽기").

**기록은 효과 안에서만 한다.** 서버에서 그리는 동안 부르면 여러 사용자가 나눠 쓰는 서버 모듈에 기록이 섞인다.

**기준 문서** — PRD 마이페이지 기능정의서 ver0.5 "최근 본 상품 조회"(최신순, 대표 이미지·상품명·판매가·할인율·정가, 찜하기·삭제), 와이어프레임 명세 73:2245("최근 본 상품(최대 9개)"). 화면은 `views/likes`의 "최근에 봤어요" 탭이다.

**기기마다 따로다.** 로그인 계정과 묶지 않는다. `QUERY_KEYS.user.recentlyViewed`는 서버 API를 위해 예약만 된 키라 쓰지 않는다.
