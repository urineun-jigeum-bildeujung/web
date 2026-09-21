// 배송지 조회·등록·수정 테스트. 무엇을 어떤 모양으로 보내고 받은 것을 어떻게 다루는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import { createAddress, getAddresses, updateAddress, type SaveAddressRequest } from "./addresses";

/** 명세 예시 JSON을 그대로 옮긴 값 */
const HOME = {
  addressId: 5,
  addressName: "집",
  receiver: "홍길동",
  phone: "010-1234-5678",
  zipCode: "06133",
  address: "서울특별시 강남구 테헤란로 123",
  addressDetail: "UI타워 4층 404호",
  deliveryNote: null,
  isDefault: true,
};

const OFFICE = { ...HOME, addressId: 9, addressName: "회사", isDefault: false };

const NEW_ADDRESS: SaveAddressRequest = {
  addressName: "자취방",
  receiver: "전경진",
  phone: "010-0000-0000",
  zipCode: "06240",
  address: "서울특별시 강남구 강남대로 62길 34",
  addressDetail: "3층",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

// **응답은 최상위 배열이다.** 명세에는 `{ addresses: [...] }`로 적혀 있지만 구현이
// `ResponseEntity<List<AddressDetailResponse>>`다. 이 테스트가 명세 쪽을 고정하고 있어
// 껍데기를 벗기던 코드가 초록불을 받았고, 실서버에 붙으면 조회가 통째로 터지는 상태였다 (#306)
test("목록은 최상위 배열로 온다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json([HOME]));
  vi.stubGlobal("fetch", fetchMock);

  const addresses = await getAddresses();

  const [url] = fetchMock.mock.calls[0] as [string];
  expect(url).toContain("/members/me/addresses");
  expect(addresses).toHaveLength(1);
  expect(addresses[0].addressName).toBe("집");
});

// 명세가 순서를 약속하지 않는다. 고르는 화면은 맨 위가 기본값처럼 읽혀서 흔들리면 안 된다
test("기본 배송지가 앞에 온다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([OFFICE, HOME])));

  const addresses = await getAddresses();

  expect(addresses.map((item) => item.addressId)).toEqual([5, 9]);
});

test("등록하면 생긴 addressId를 돌려준다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ addressId: 12 }, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);

  const addressId = await createAddress(NEW_ADDRESS);

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/members/me/addresses");
  expect(init.method).toBe("POST");
  expect(JSON.parse(String(init.body))).toEqual(NEW_ADDRESS);
  expect(addressId).toBe(12);
});

// 수정은 204라 본문이 없다. `json()`을 바로 부르면 빈 본문에서 던져 성공이 실패로 뒤집힌다 (#217)
test("수정은 본문 없는 응답에서도 성공으로 끝난다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(updateAddress(5, { addressName: "본가" })).resolves.toBeUndefined();

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/members/me/addresses/5");
  expect(init.method).toBe("PATCH");
  expect(JSON.parse(String(init.body))).toEqual({ addressName: "본가" });
});
