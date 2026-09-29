// 바로 구매 주소 테스트. 만든 주소를 그대로 읽는지, 틀린 값은 없는 것으로 보는지 본다.
import { expect, test } from "vitest";

import { BUY_NOW_PARAM, parseBuyNow, toBuyNowPath } from "./buy-now";

test("상품과 수량을 결제 화면 주소에 싣고, 그 값을 그대로 읽어 온다", () => {
  const path = toBuyNowPath({ itemType: "NORMAL", itemId: 252, quantity: 2 });

  expect(path).toBe("/payment?buy=NORMAL%3A252%3A2");
  const value = new URL(path, "https://leechs.shop").searchParams.get(BUY_NOW_PARAM);
  expect(parseBuyNow(value)).toEqual({ itemType: "NORMAL", itemId: 252, quantity: 2 });
});

test("타임딜은 딜 아이템 번호로 싣는다", () => {
  expect(parseBuyNow("TIME_DEAL:7:1")).toEqual({ itemType: "TIME_DEAL", itemId: 7, quantity: 1 });
});

// 주소창으로 고친 값이 주문 본문에 그대로 실리면 서버가 400으로 거절한다
test("종류·번호·수량이 맞지 않으면 없는 것으로 본다", () => {
  expect(parseBuyNow(null)).toBeNull();
  expect(parseBuyNow("")).toBeNull();
  expect(parseBuyNow("GIFT:252:1")).toBeNull();
  expect(parseBuyNow("NORMAL:abc:1")).toBeNull();
  expect(parseBuyNow("NORMAL:-3:1")).toBeNull();
  expect(parseBuyNow("NORMAL:252:0")).toBeNull();
  expect(parseBuyNow("NORMAL:252:1.5")).toBeNull();
  expect(parseBuyNow("NORMAL:252")).toBeNull();
});
