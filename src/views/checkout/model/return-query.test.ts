// 복귀 쿼리. 토스가 붙이는 이름과 겹치면 주문 상세로 갈 값을 잃는다.
import { expect, test } from "vitest";

import { ORDER_PARAM, readOrderId, toFailUrl, toSuccessUrl } from "./return-query";

test("복귀 주소에 숫자 주문 id를 싣는다", () => {
  expect(toSuccessUrl("https://leechs.shop", 12)).toBe("https://leechs.shop/payment/done?order=12");
});

test("**토스가 붙이는 orderId와 겹치지 않는다**", () => {
  // 토스는 성공 주소에 paymentType·orderId·paymentKey·amount를 덧붙인다. 우리 이름이
  // `orderId`면 문자열 주문번호에 덮여, 주문 상세로 갈 숫자 id를 잃는다
  expect(ORDER_PARAM).not.toBe("orderId");

  // 토스가 덧붙인 뒤의 주소를 흉내 낸다. 둘이 따로 읽혀야 한다
  const returned = new URL(`${toSuccessUrl("https://leechs.shop", 12)}&paymentType=NORMAL`);
  returned.searchParams.append("orderId", "ORD-20260921-000123");

  expect(readOrderId(returned.searchParams.get(ORDER_PARAM) ?? undefined)).toBe(12);
  expect(returned.searchParams.get("orderId")).toBe("ORD-20260921-000123");
});

test("읽을 수 없는 값은 null이다", () => {
  // 주소창으로 직접 들어오거나 예전 주소로 돌아온 경우다. 엉뚱한 주문을 여느니 비운다
  expect(readOrderId(undefined)).toBeNull();
  expect(readOrderId("")).toBeNull();
  expect(readOrderId("ORD-20260921-000123")).toBeNull();
  expect(readOrderId("0")).toBeNull();
  expect(readOrderId("-3")).toBeNull();
  expect(readOrderId("1.5")).toBeNull();
});

test("숫자 문자열은 그대로 읽는다", () => {
  expect(readOrderId("1")).toBe(1);
  expect(readOrderId("20260921")).toBe(20260921);
});

// 고른 것이 빠진 채 돌아오면 장바구니 전체로 읽혀 고르지 않은 상품까지 주문된다 (#364)
test("실패 복귀 주소는 고른 상품을 되돌려 싣는다", () => {
  const url = new URL(toFailUrl("https://leechs.shop", "?items=NORMAL%3A1%2CNORMAL%3A2"));

  expect(url.pathname).toBe("/payment");
  expect(url.searchParams.get("items")).toBe("NORMAL:1,NORMAL:2");
});

// `?items=`는 전체가 아니라 빈 선택이다. 그대로 되돌려야 결제 버튼이 잠긴 채로 남는다
test("빈 선택도 그대로 되돌린다", () => {
  const url = new URL(toFailUrl("https://leechs.shop", "?items="));

  expect(url.searchParams.get("items")).toBe("");
});

test("고른 것이 없으면 쿼리도 붙이지 않는다", () => {
  expect(toFailUrl("https://leechs.shop", "")).toBe("https://leechs.shop/payment");
});

// 실어 돌면 실패 안내가 옛 값으로 다시 뜨고 주소가 회차마다 길어진다
test("토스가 붙인 값은 다음 복귀 주소로 옮기지 않는다", () => {
  const url = new URL(
    toFailUrl(
      "https://leechs.shop",
      "?items=NORMAL%3A1&code=PAY_PROCESS_CANCELED&message=%EC%B7%A8%EC%86%8C&orderId=ORD-1",
    ),
  );

  expect(url.searchParams.get("items")).toBe("NORMAL:1");
  expect(url.searchParams.get("code")).toBeNull();
  expect(url.searchParams.get("message")).toBeNull();
  expect(url.searchParams.get("orderId")).toBeNull();
});
