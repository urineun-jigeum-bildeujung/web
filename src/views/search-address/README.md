# views/search-address

주소 검색 화면. UI 시안 `mypa_312_입력전`, `mypa_312`, `mypa_312_검색결과`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/search-address-view.tsx` | 주소 검색 |
| `ui/search-address-view.test.tsx` | 검색 조건, 페이지 넘기기, 고른 주소를 어떻게 넘기는지 |
| `api/address-search.ts` | 행안부 주소를 `/api/juso`를 거쳐 가져온다 |
| `api/address-search.test.ts` | 무엇을 보내고 돌아온 것을 어떻게 다루는지 |
| `api/use-query-address-search.ts` | 조회 훅. 화면은 `useQuery`를 직접 부르지 않는다 |
| `../../app/api/juso/route.ts` | 승인키를 서버에 두는 통로 (app 레이어) |
| `index.ts` | 공개 API |

## 페이지네이션

**한 페이지에 4개**이고 목록 바로 아래에 넘기는 버튼을 둔다. PD팀이 393×852에서 스크롤이 생기지 않는 수로 정했다(2026-09-15).

쪽 번호를 늘어놓지 않는다. `역삼동` 4,747건 · `강남대로` 2,793건처럼 흔한 검색어가 쪽 천 개를 넘기기 때문이다. 몇 쪽 중 몇 쪽인지만 보여 주고 검색어를 좁히게 한다.

페이지를 화면에서 자르지 않고 `api/address-search.ts`에서 자르는 것은 행안부 API가 `currentPage`·`countPerPage`를 받아 서버에서 잘라 주기 때문이다. 지금부터 그 모양으로 맞춰 두면 연동할 때 그 파일 안만 바뀐다.

## 라우트

`/mypage/address/search` — `src/app/mypage/address/search/page.tsx`

## 주소창이 들고 있는 것

| 쿼리 | 뜻 |
| --- | --- |
| `query` | 찾은 말. 입력 중인 값이 아니라 **검색을 누른 값**이다 |
| `page` | 몇 쪽인지. 화면 구성이 바뀌므로 `history: "push"`로 뒤로가기가 앞 쪽으로 돌아간다 |
| `place` | 어느 배송지를 고치던 중인지. 배송지 화면이 실어 보내고 그대로 돌려준다 |

결과를 상태로 들지 않고 `query`·`page`에서 만든다. 그래야 새로고침해도 같은 화면이 나온다. 고른 항목도 지우지 않고 **지금 목록에 있는지**로 판단해, 쪽을 넘기거나 다시 찾으면 저절로 풀린다.

## 고른 주소를 넘기는 방법

`/mypage/address/new?zipNo=...&roadAddr=...`로 이동한다. 화면은 도로명만 보여주지만(시안) 우편번호도 함께 싣는다 — 백엔드가 `zipNo → zipCode`, `roadAddr → address`로 받기로 했다.

## 왜 다음 우편번호 위젯을 쓰지 않는가

디자인팀이 화면 커스텀을 요청했다. `react-daum-postcode`는 다음이 만든 UI를 통째로 띄워 커스텀이 안 된다. 상세는 [library-convention](../../../docs/conventions/library-convention.md)의 "겪은 사례" 표를 본다.

## 행정안전부 API

프론트엔드가 직접 붙였다. 백엔드팀이 "계획은 있었지만 밀렸으니 직접 해주시면 따르겠다"고 회신했다(2026-09-15).

**승인키를 브라우저로 내보내지 않으려고 Route Handler(`src/app/api/juso/route.ts`)를 거친다.** 행안부는 CORS를 열어 두어 직접 불러도 되지만 그러면 `confmKey`가 클라이언트 번들에 박힌다.

| 항목 | 값 |
| --- | --- |
| 엔드포인트 | `https://business.juso.go.kr/addrlink/addrLinkApi.do` |
| 파라미터 | `confmKey` · `keyword` · `currentPage` · `countPerPage` · `resultType=json` |
| 승인키 | `.env.local`의 `JUSO_CONFM_KEY`. **`NEXT_PUBLIC_`을 붙이지 않는다** |

**실패를 HTTP 200에 담아 보낸다.** `res.ok`로는 못 거르고 `results.common.errorCode`를 봐야 한다. Route Handler가 그것을 우리 `ProblemDetail`로 옮겨, 화면이 `toAppMessageCode`를 그대로 쓴다.

| 행안부 | HTTP | 우리 errorCode |
| --- | --- | --- |
| `E0001` 승인 안 된 키 | 500 | `JUSO_500_INVALID_KEY` |
| `E0006` 검색어가 너무 넓음 (`서울`) | 400 | `JUSO_400_KEYWORD_TOO_BROAD` |
| `E0008` 두 글자 미만 | 400 | `JUSO_400_KEYWORD_TOO_SHORT` |
| `E0009` 문자와 숫자를 같이 | 400 | `JUSO_400_KEYWORD_INVALID` |
| `E0012` 특수문자와 숫자만 (`42-18`) | 400 | `JUSO_400_KEYWORD_INVALID` |
| `E0010` 한글 40자 초과 · `E0011` 숫자 10자 초과 | 400 | `JUSO_400_KEYWORD_TOO_LONG` |
| `E0013` `%`·`=`·`<>`·`[]`·SQL 예약어 | 400 | `JUSO_400_KEYWORD_FORBIDDEN_CHAR` |
| 그 밖 | 502 | `JUSO_502_UPSTREAM` |

**입력 오류는 모두 400으로 옮긴다.** 502로 두면 재시도 대상이라 결과가 뻔한 요청을 한 번 더 보내고 "일시적인 오류"를 띄운다. `E0012`는 `E0009`와 같은 안내("숫자만으로는 찾을 수 없어요")가 맞고, 길이·금지 문자 둘은 따로 문구를 두지 않아 400 기본 문구로 떨어진다 (#423).

**쪽 보정은 반만 해 준다.** `0`·음수·숫자가 아닌 값은 1로 바꿔 주지만 **마지막 쪽을 넘는 값은 그대로 받아 결과 0건을 준다** — `page=999`에 `totalCount=1`이면서 빈 목록이다(2026-09-15 실측). 그 경우만 조회 함수가 마지막 쪽을 다시 받아온다.

응답 필드는 24개지만 Route Handler가 화면이 쓰는 넷(`zipNo`·`roadAddr`·`jibunAddr`·`bdNm`)만 추려 보낸다.

**2xx라고 해서 우리가 아는 모양이라는 보장은 없다.** 점검 안내 페이지가 200으로 올 수 있어, Route Handler가 `results.common`의 생김새를 확인하고 아니면 `JUSO_502_UPSTREAM`으로 돌린다. 기다리는 시간도 5초로 끊는다 — 없으면 답하지 않는 요청이 쌓여 주소 검색 전체가 느려진다.

## 쪽을 넘길 때

`keepPreviousData`로 앞 결과를 그대로 둔다. 지우고 뼈대를 띄우면 넘길 때마다 화면이 들썩인다. 뼈대는 보여 줄 앞 결과가 없는 첫 검색에서만 나온다.

## 아직 없는 것

없다. 주소 검색은 `/api/juso`로, 배송지 저장·조회는 `useMutateAddress`·`useQueryAddresses`로 붙어 있다 (#237).
