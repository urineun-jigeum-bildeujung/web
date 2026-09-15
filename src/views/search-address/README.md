# views/search-address

주소 검색 화면. UI 시안 `mypa_312_입력전`, `mypa_312`, `mypa_312_검색결과`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/search-address-view.tsx` | 주소 검색 |
| `ui/search-address-view.test.tsx` | 검색 조건, 페이지 넘기기, 고른 주소를 어떻게 넘기는지 |
| `api/address-search.ts` | 주소를 찾아오는 자리. 지금은 목이고 페이지도 여기서 자른다 |
| `index.ts` | 공개 API |

## 페이지네이션

**한 페이지에 4개**이고 목록 바로 아래에 넘기는 버튼을 둔다. PD팀이 393×852에서 스크롤이 생기지 않는 수로 정했다(2026-09-15).

쪽 번호를 늘어놓지 않는다. `역삼동` 4,747건 · `강남대로` 2,793건처럼 흔한 검색어가 쪽 천 개를 넘기기 때문이다. 몇 쪽 중 몇 쪽인지만 보여 주고 검색어를 좁히게 한다.

페이지를 화면에서 자르지 않고 `api/address-search.ts`에서 자르는 것은 행안부 API가 `currentPage`·`countPerPage`를 받아 서버에서 잘라 주기 때문이다. 지금부터 그 모양으로 맞춰 두면 연동할 때 그 파일 안만 바뀐다.

## 라우트

`/mypage/address/search` — `src/app/mypage/address/search/page.tsx`

## 고른 주소를 넘기는 방법

`/mypage/address/new?zipNo=...&roadAddr=...`로 이동한다. 화면은 도로명만 보여주지만(시안) 우편번호도 함께 싣는다 — 백엔드가 `zipNo → zipCode`, `roadAddr → address`로 받기로 했다.

## 왜 다음 우편번호 위젯을 쓰지 않는가

디자인팀이 화면 커스텀을 요청했다. `react-daum-postcode`는 다음이 만든 UI를 통째로 띄워 커스텀이 안 된다. 상세는 [library-convention](../../../docs/conventions/library-convention.md)의 "겪은 사례" 표를 본다.

## 아직 없는 것

행정안전부 도로명주소 API 연동. 지금은 목 데이터이고, 프론트엔드가 직접 붙이기로 백엔드팀과 합의했다(2026-09-15).

붙일 때 알아야 할 것을 실측해 두었다.

| 항목 | 값 |
| --- | --- |
| 엔드포인트 | `https://business.juso.go.kr/addrlink/addrLinkApi.do` |
| 파라미터 | `confmKey` · `keyword` · `currentPage` · `countPerPage` · `resultType=json` |
| 승인키 | `.env.local`의 `JUSO_CONFM_KEY`. **`NEXT_PUBLIC_`을 붙이지 않는다** — 붙이면 브라우저 번들에 박힌다 |
| 호출 위치 | Route Handler. CORS는 열려 있지만 직접 부르면 키가 노출된다 |

**실패를 HTTP 200에 담아 보낸다.** `res.ok`로는 못 거르고 `results.common.errorCode`를 봐야 한다.

| errorCode | 뜻 |
| --- | --- |
| `0` | 정상 |
| `E0001` | 승인되지 않은 KEY |
| `E0006` | 검색어가 너무 광범위함 (`서울` 등) |
| `E0008` | 검색어 두 글자 이상 필요 |
| `E0009` | 문자와 숫자를 같이 넣어야 함 |

`countPerPage`는 100까지 받는다. 우리는 4를 넘긴다(위 페이지네이션 절).
