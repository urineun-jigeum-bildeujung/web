// 서버 상태 매핑 테스트. 아는 값만 통과하고 모르는 값은 막히는지 본다.
import { expect, test } from "vitest";

import { toOrderStatus } from "./order-status";

test("화면이 그리는 네 상태를 서버 값에서 옮긴다", () => {
  // 결제완료와 상품 준비는 한 단계로 묶인다 (#297)
  expect(toOrderStatus("PAID")).toBe("preparing");
  expect(toOrderStatus("PREPARING")).toBe("preparing");
  expect(toOrderStatus("SHIPPING")).toBe("shipping");
  expect(toOrderStatus("DELIVERED")).toBe("delivered");
  expect(toOrderStatus("CONFIRMED")).toBe("confirmed");
});

test("대소문자가 달라도 같은 값으로 읽는다", () => {
  expect(toOrderStatus("paid")).toBe("preparing");
  expect(toOrderStatus("Delivered")).toBe("delivered");
});

// 백엔드 enum에는 아홉이 있지만 시안에 자리가 있는 것은 다섯뿐이다. 나머지를 억지로
// 끼워 넣으면 없는 단계가 있는 것처럼 보인다. 어떻게 보여줄지는 PD 확인 대상이다 (#288).
// 주문 상세가 주문 상태를 보여야 해(QA No.287, #655) 취소·환불 셋도 옮긴다
test("취소·환불 상태도 화면 상태로 옮긴다", () => {
  expect(toOrderStatus("CANCELLED")).toBe("cancelled");
  expect(toOrderStatus("REFUNDED")).toBe("refunded");
  expect(toOrderStatus("PARTIAL_REFUND")).toBe("partialRefund");
});

test("화면에 설 일이 없는 결제 전 상태와 빈 값은 null이다", () => {
  expect(toOrderStatus("PENDING")).toBeNull();
  expect(toOrderStatus("")).toBeNull();
});

// Object.prototype의 속성 이름이 상태로 오면 상속된 값이 잡혀 뱃지가 엉뚱하게 붙을 수 있다.
test("프로토타입 속성 이름이 와도 상태로 읽지 않는다", () => {
  expect(toOrderStatus("constructor")).toBeNull();
  expect(toOrderStatus("toString")).toBeNull();
});
