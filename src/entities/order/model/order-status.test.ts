// 서버 상태 매핑 테스트. 아는 값만 통과하고 모르는 값은 막히는지 본다.
import { expect, test } from "vitest";

import { toOrderStatus } from "./order-status";

test("명세에서 확인된 세 값을 화면 상태로 옮긴다", () => {
  expect(toOrderStatus("PAID")).toBe("paid");
  expect(toOrderStatus("DELIVERED")).toBe("delivered");
  expect(toOrderStatus("CONFIRMED")).toBe("confirmed");
});

test("대소문자가 달라도 같은 값으로 읽는다", () => {
  expect(toOrderStatus("paid")).toBe("paid");
  expect(toOrderStatus("Delivered")).toBe("delivered");
});

// 명세에 없는 값을 추측으로 매핑하면 틀렸을 때 조용히 엉뚱한 뱃지가 붙는다.
// 모르는 것은 모른다고 돌려줘야 화면이 감출 수 있다 (#284).
test("명세에 없는 값은 추측하지 않고 null이다", () => {
  expect(toOrderStatus("PREPARING")).toBeNull();
  expect(toOrderStatus("SHIPPING")).toBeNull();
  expect(toOrderStatus("CANCELLED")).toBeNull();
  expect(toOrderStatus("")).toBeNull();
});

// Object.prototype의 속성 이름이 상태로 오면 상속된 값이 잡혀 뱃지가 엉뚱하게 붙을 수 있다.
test("프로토타입 속성 이름이 와도 상태로 읽지 않는다", () => {
  expect(toOrderStatus("constructor")).toBeNull();
  expect(toOrderStatus("toString")).toBeNull();
});
