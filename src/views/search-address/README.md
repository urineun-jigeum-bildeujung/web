# views/search-address

주소 검색 화면. UI 시안 `mypa_312_입력전`, `mypa_312`, `mypa_312_검색결과`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/search-address-view.tsx` | 주소 검색 |
| `ui/search-address-view.test.tsx` | 검색 조건과 고른 주소를 어떻게 넘기는지 |
| `index.ts` | 공개 API |

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

`countPerPage`는 100까지 받는다. 다만 `역삼동` 4,747건 · `강남대로` 2,793건처럼 결과가 많아, 페이지네이션만으로는 좁은 화면에서 쓸 수 없다. 건수 안내와 더 보기를 어떻게 둘지 PD팀 확인 대기 중.
