// 배송지 등록 흐름을 세운다 — 주소 검색과 등록.
//
// **`stubMemberProfile` 뒤에 걸어야 한다.** 그쪽도 `**/members/me/addresses`를 잡는데
// Playwright는 나중에 건 route가 이긴다. 목록은 그대로 두고 등록(POST)만 여기서 받는다.

import type { Page } from "@playwright/test";

/** 행안부 응답을 우리 Route Handler(`/api/juso`)가 옮겨 준 모양 */
const RESULTS = [
  {
    zipNo: "06133",
    roadAddr: "서울특별시 강남구 테헤란로 123 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 678-9",
    bdNm: "UI타워",
  },
  {
    zipNo: "04039",
    roadAddr: "서울특별시 마포구 양화로 45 (서교동)",
    jibunAddr: "서울특별시 마포구 서교동 401-1",
  },
];

/** 저장해 둔 배송지. `stubMemberProfile`이 주는 것과 같은 한 건이다 */
const SAVED = [
  {
    addressId: 1,
    addressName: "집",
    receiver: "권도형",
    phone: "01012345678",
    zipCode: "06234",
    address: "서울특별시 강남구 테헤란로 123",
    addressDetail: "UI타워 4층",
    deliveryNote: null,
    isDefault: true,
  },
];

type AddressStubOptions = {
  /** 등록으로 나간 요청 본문을 담아 둔다. 무엇을 보냈는지 보는 테스트가 쓴다 */
  saved?: unknown[];
};

/**
 * 주소 검색과 배송지 등록을 세운다.
 *
 * 검색은 우리 Route Handler를 거치므로 백엔드가 아니라 `/api/juso`를 잡는다. 승인키가
 * 브라우저에 없어 세우지 않으면 500이 난다.
 */
export async function stubAddressFlow(page: Page, options: AddressStubOptions = {}) {
  await page.route("**/api/juso**", (route) =>
    route.fulfill({ json: { items: RESULTS, totalCount: RESULTS.length, currentPage: 1 } }),
  );

  await page.route("**/members/me/addresses", (route) => {
    if (route.request().method() === "POST") {
      options.saved?.push(route.request().postDataJSON());
      return route.fulfill({ status: 201, json: { addressId: 9 } });
    }
    return route.fulfill({ json: SAVED });
  });
}
