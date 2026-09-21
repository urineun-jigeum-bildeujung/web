// 복귀 쿼리. 토스가 붙이는 이름과 겹치면 주문 상세로 갈 값을 잃는다.
import { expect, test } from "vitest";

import { ORDER_PARAM, readOrderId, toSuccessUrl } from "./return-query";

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
