// 주문 완료 테스트. 무엇을 샀는지와 다음에 갈 곳이 보이는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { APP_MESSAGE_CODE } from "@/shared/config/app-message";

import { CheckoutDoneView } from "./checkout-done-view";

test("주문번호와 도착 예정을 알린다", () => {
  render(<CheckoutDoneView />);

  expect(screen.getByText("주문을 무사히 마쳤어요")).toBeDefined();
  expect(screen.getByText("20260829-1234567")).toBeDefined();
  expect(screen.getByText("모레(9/3)")).toBeDefined();
});

test("결제 내역과 배송지를 함께 남긴다", () => {
  render(<CheckoutDoneView />);

  expect(screen.getByRole("heading", { name: "결제상세" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "배송지 정보" })).toBeDefined();
  expect(screen.getByText("토스페이")).toBeDefined();
  expect(screen.getByText("3,000원")).toBeDefined();
});

// 방금 한 주문을 바로 볼 수 있어야 주문 내역을 다시 찾아 들어가지 않는다 (paym_002)
test("주문 상세와 홈으로 갈 수 있다", () => {
  render(<CheckoutDoneView />);

  expect(screen.getByRole("link", { name: "주문 상세 보기" }).getAttribute("href")).toBe(
    "/mypage/orders/1",
  );
  expect(screen.getByRole("link", { name: "홈으로 가기" }).getAttribute("href")).toBe("/");
});

// 되돌아갈 곳이 없는 화면이라 뒤로가기 대신 닫기를 둔다
test("뒤로가기 대신 닫기가 있다", () => {
  render(<CheckoutDoneView />);

  expect(screen.getByRole("link", { name: "닫기" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "이전 화면으로" })).toBeNull();
});

/**
 * 승인이 막히면 결제창에서는 이미 성공한 뒤라 **돈이 빠져나갔을 수 있다.**
 * 그 상태에서 화면이 해야 할 일은 사실을 알리고 문의할 수단을 주는 것이다 (#260).
 */
test("승인이 실패하면 완료가 아니라 그 사실을 알린다", () => {
  render(
    <CheckoutDoneView
      failure={{ orderId: "ORD-20260919-000001", code: APP_MESSAGE_CODE.payment.confirmFailed }}
    />,
  );

  expect(screen.getByRole("alert")).toBeDefined();
  expect(screen.getByText("결제 확인이 끝나지 않았어요")).toBeDefined();
  // 성공 화면의 문구가 함께 뜨면 안 된다
  expect(screen.queryByText("주문을 무사히 마쳤어요")).toBeNull();
});

// 승인 응답이 없으니 화면이 댈 수 있는 식별자가 이것뿐이다. 문의할 때 사용자가 부르는 번호다
test("승인이 실패해도 주문번호는 보인다", () => {
  render(
    <CheckoutDoneView
      failure={{ orderId: "ORD-20260919-000001", code: APP_MESSAGE_CODE.payment.confirmFailed }}
    />,
  );

  expect(screen.getByText("주문번호")).toBeDefined();
  expect(screen.getByText("ORD-20260919-000001")).toBeDefined();
});

/**
 * **다시 결제하러 가는 길을 주지 않는다.** 이미 결제됐을 수 있어 다시 누를 자리를 만들면
 * 두 번 결제될 여지가 생긴다.
 */
test("승인이 실패하면 다시 결제하러 보내지 않는다", () => {
  render(
    <CheckoutDoneView
      failure={{ orderId: "ORD-20260919-000001", code: APP_MESSAGE_CODE.payment.confirmFailed }}
    />,
  );

  const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
  expect(hrefs).not.toContain("/payment");
  expect(hrefs).toContain("/mypage/support");
  expect(hrefs).toContain("/mypage/orders");
});
