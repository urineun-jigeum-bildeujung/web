// 회원 정보 조회를 가로채 정해진 답을 준다.
//
// **로그인이 있어야 하는 요청이다(#266).** 세우지 않으면 401이고, 백엔드가 떠 있느냐에
// 따라 같은 테스트가 로컬과 CI에서 달라진다. 무엇을 보내는지는 단위 테스트
// (`entities/member/api/profile.test.ts`)가 본다.

import type { Page } from "@playwright/test";

const PROFILE = {
  nickname: "신나는강아지813",
  name: null,
  birth: null,
  phone: null,
  image: null,
  email: "me@example.com",
};

/** 배송지도 같은 화면이 함께 부른다 */
const ADDRESSES = [
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

export async function stubMemberProfile(page: Page) {
  // `*`는 `/`를 넘지 않아 /members/me 와 하위 경로가 섞이지 않는다
  await page.route("**/members/me", (route) => route.fulfill({ json: PROFILE }));
  await page.route("**/members/me/addresses", (route) => route.fulfill({ json: ADDRESSES }));
}
