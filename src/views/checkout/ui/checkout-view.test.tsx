// 결제하기 테스트. 금액 표시와 결제 잠금, 결제창을 띄우는지 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { expect, test, vi } from "vitest";

const { requestPayment, toastAppError } = vi.hoisted(() => ({
  requestPayment: vi.fn(),
  toastAppError: vi.fn(),
}));

vi.mock("@/shared/lib/app-toast", () => ({ toastAppError }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// 위젯은 토스 서버에서 스크립트를 받아 온다. 테스트에서는 준비됐다고만 알린다
vi.mock("./toss-payment-widget", () => ({
  TossPaymentWidget: ({ onReady }: { onReady: (fn: () => Promise<void>) => void }) => {
    useEffect(() => {
      onReady(requestPayment);
    }, [onReady]);
    return <div data-testid="toss-widget" />;
  },
}));

import { CheckoutView } from "./checkout-view";

test("결제 내역을 항목별로 읽을 수 있다", () => {
  render(<CheckoutView />);

  expect(screen.getByText("배송비")).toBeDefined();
  expect(screen.getByText("3,000원")).toBeDefined();
  expect(screen.getByText("주문 수량 1개")).toBeDefined();
});

// 결제수단 목록은 토스 위젯이 그린다. 우리가 라디오를 만들지 않는다
test("결제 방법 자리를 토스 위젯이 채운다", () => {
  render(<CheckoutView />);
  expect(screen.getByTestId("toss-widget")).toBeDefined();
});

// 결제는 되돌릴 수 없다. 필수 동의 없이 눌리면 무엇에 동의했는지 모르는 채로 돈이 나간다.
test("필수 약관에 동의해야 결제할 수 있다", () => {
  render(<CheckoutView />);

  const pay = screen.getByRole("button", { name: "결제하기" });
  expect(pay.hasAttribute("disabled")).toBe(true);

  for (const label of [
    "[필수] 주문 상품 정보 동의",
    "[필수] 개인정보 제3자 제공 동의",
    "[필수] 결제 대행 서비스(PG) 이용 약관 동의",
  ]) {
    fireEvent.click(screen.getByLabelText(label));
  }

  // 선택 항목은 켜지 않아도 결제할 수 있다
  expect(pay.hasAttribute("disabled")).toBe(false);
});

test("결제하기를 누르면 결제창을 띄운다", () => {
  render(<CheckoutView />);

  for (const label of [
    "[필수] 주문 상품 정보 동의",
    "[필수] 개인정보 제3자 제공 동의",
    "[필수] 결제 대행 서비스(PG) 이용 약관 동의",
  ]) {
    fireEvent.click(screen.getByLabelText(label));
  }
  fireEvent.click(screen.getByRole("button", { name: "결제하기" }));

  expect(requestPayment).toHaveBeenCalled();
});

test("전체 동의를 켜면 네 줄이 함께 켜진다", () => {
  render(<CheckoutView />);

  fireEvent.click(screen.getByLabelText("전체 동의"));

  // 이 저장소는 jest-dom을 붙이지 않아 toBeChecked가 없다. shadcn Checkbox의 상태로 본다
  expect(
    screen.getByLabelText("[선택] 다음 주문을 위해 이 결제 수단 저장").getAttribute("data-state"),
  ).toBe("checked");
  expect(screen.getByRole("button", { name: "결제하기" }).hasAttribute("disabled")).toBe(false);
});

// 시안(paym_001_직접입력)은 직접 입력을 고른 뒤에만 칸을 연다
test("직접 입력을 고르기 전에는 입력 칸이 없다", () => {
  render(<CheckoutView />);

  expect(screen.queryByLabelText("배송 요청사항 직접 입력")).toBeNull();
});

/**
 * 결제창이 뜬 뒤의 실패·취소는 토스가 `failUrl`로 되돌려 보내 `?code=`로 알 수 있지만,
 * 창을 띄우기도 전에 막히면 리다이렉트가 없다. 놓치면 눌러도 아무 일이 없어 보인다.
 */
test("결제창을 띄우지 못하면 실패를 알린다", async () => {
  requestPayment.mockRejectedValueOnce(new Error("INVALID_PARAMETERS"));
  render(<CheckoutView />);

  fireEvent.click(screen.getByLabelText("전체 동의"));
  fireEvent.click(screen.getByRole("button", { name: "결제하기" }));

  await waitFor(() =>
    expect(toastAppError).toHaveBeenCalledWith("payment.failed", expect.any(Error)),
  );
  // 알리고 끝이 아니라 다시 누를 수 있어야 한다
  expect(screen.getByRole("button", { name: "결제하기" }).hasAttribute("disabled")).toBe(false);
});
