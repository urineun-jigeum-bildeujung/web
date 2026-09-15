// 주소를 찾아오는 자리. 행정안전부 API를 붙이기 전까지 목을 돌려준다.
//
// 화면이 이 함수만 보게 해 두면, API가 붙을 때 이 안이 fetch 호출로 바뀌고 화면 코드는 그대로 둘 수 있다.
// 페이지를 화면에서 자르지 않고 여기서 자르는 것도 같은 이유다 — 행안부 API가 `currentPage`·`countPerPage`를
// 받아 서버에서 잘라 주므로, 지금부터 그 모양으로 맞춰 둔다.
//
// 붙일 때 알아야 할 것은 이 슬라이스의 README에 적어 두었다. 승인키는 `.env.local`의 `JUSO_CONFM_KEY`이고
// 브라우저로 나가면 안 되므로 Route Handler를 거친다.

import type { AddressResult } from "@/shared/ui/address-result-list/address-result-list";

/** 한 페이지에 보여줄 개수. PD팀이 393×852에서 스크롤 없이 들어가는 수로 4개를 정했다 (2026-09-15) */
export const ADDRESS_PAGE_SIZE = 4;

export type AddressSearchResult = {
  /** 이번 페이지에 보여줄 주소 */
  items: AddressResult[];
  /** 검색어에 걸린 전체 개수. 행안부 응답의 `common.totalCount`에 해당한다 */
  totalCount: number;
};

/**
 * API 연동 전까지 화면 확인용.
 * 지어낸 값이 아니라 행안부 API가 `테헤란로`로 실제 내려준 응답을 옮겼다.
 */
const MOCK_RESULTS: AddressResult[] = [
  {
    zipNo: "06133",
    roadAddr: "서울특별시 강남구 테헤란로 123 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 648-23 여삼빌딩",
    bdNm: "여삼빌딩",
  },
  {
    zipNo: "06134",
    roadAddr: "서울특별시 강남구 테헤란로 101 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 821 이즈타워",
    bdNm: "이즈타워",
  },
  {
    zipNo: "06134",
    roadAddr: "서울특별시 강남구 테헤란로 103 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 822 인춘재단빌딩",
    bdNm: "인춘재단빌딩",
  },
  // 건물명이 없는 결과도 온다. 세 줄 구성이 흐트러지지 않는지 이걸로 본다
  {
    zipNo: "06134",
    roadAddr: "서울특별시 강남구 테헤란로 105 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 822-1",
  },
  {
    zipNo: "06134",
    roadAddr: "서울특별시 강남구 테헤란로 107 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 822-2 메디타워",
    bdNm: "메디타워",
  },
  {
    zipNo: "06232",
    roadAddr: "서울특별시 강남구 테헤란로 108 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 825-17 영림빌딩",
    bdNm: "영림빌딩",
  },
  {
    zipNo: "06134",
    roadAddr: "서울특별시 강남구 테헤란로 109 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 822-4 강남제일빌딩",
    bdNm: "강남제일빌딩",
  },
  {
    zipNo: "06232",
    roadAddr: "서울특별시 강남구 테헤란로 110 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 825-18 켐브리지 강남빌딩",
    bdNm: "켐브리지 강남빌딩",
  },
  {
    zipNo: "06232",
    roadAddr: "서울특별시 강남구 테헤란로 110-2 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 804 가로판매대",
    bdNm: "가로판매대",
  },
];

/**
 * 주소를 찾는다. `page`는 1부터 센다.
 *
 * API가 생기면 이 안이 Route Handler 호출로 바뀐다. 호출부는 바뀌지 않는다.
 */
export function searchAddresses(keyword: string, page: number): AddressSearchResult {
  // 검색어를 무시하면 무엇을 찾아도 같은 결과가 나와, 결과 없는 화면이 화면에서 도달하지 않는다.
  // 진짜 API처럼 거른다 — 정확한 규칙은 아니지만 "찾은 말에 따라 달라진다"는 성질은 같다
  const needle = keyword.trim();
  const matched = MOCK_RESULTS.filter((item) =>
    [item.roadAddr, item.jibunAddr, item.bdNm].some((field) => field?.includes(needle)),
  );

  const start = (page - 1) * ADDRESS_PAGE_SIZE;

  return {
    items: matched.slice(start, start + ADDRESS_PAGE_SIZE),
    totalCount: matched.length,
  };
}
