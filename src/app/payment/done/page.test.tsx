// 주문 완료 라우트 테스트. 승인이 실패해도 화면 밖으로 새지 않는지 본다.
//
// 화면 조각은 `checkout-done-view.test.tsx`가 보고, 여기서는 **라우트가 실패를 어떻게
// 다루는지**만 본다 — 던지지 않는 것과 어떤 문구 코드로 옮기는지다 (#261 리뷰).
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { ApiError } from "@/shared/api/client";

const { confirmPayment } = vi.hoisted(() => ({ confirmPayment: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

// 화면은 진짜를 쓴다. 라우트가 넘긴 것이 실제로 그려지는지까지 봐야 의미가 있다
vi.mock("@/views/checkout", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/views/checkout")>()),
  confirmPayment,
}));

import PaymentDonePage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

/** 라우트는 서버 컴포넌트라 약속을 돌려준다. 풀어서 그린다 */
async function renderPage(params: Record<string, string>) {
  const ui = await PaymentDonePage({ searchParams: Promise.resolve(params) });
  return render(ui);
}

const QUERY = { paymentKey: "test_key", orderId: "ORD-20260919-000001", amount: "12345" };

test("승인이 성공하면 완료 화면을 그린다", async () => {
  confirmPayment.mockResolvedValueOnce({
    paymentId: 1,
    orderNumber: "ORD-20260919-000001",
    paymentStatus: "DONE",
    amount: 12345,
    method: "토스페이",
    approvedAt: "2026-09-19T10:00:00",
  });

  await renderPage(QUERY);

  expect(screen.getByText("주문을 무사히 마쳤어요")).toBeDefined();
  expect(confirmPayment).toHaveBeenCalledWith({
    paymentKey: "test_key",
    orderId: "ORD-20260919-000001",
    amount: 12345,
  });
});

/**
 * **승인이 던져도 라우트 오류로 떨어지면 안 된다.** 결제창에서는 이미 성공한 뒤라
 * "화면이 멈췄어요"만 보이면 사용자가 결제 결과도 문의 수단도 알 수 없다 (#260).
 */
test("승인이 실패해도 던지지 않고 화면으로 알린다", async () => {
  confirmPayment.mockRejectedValueOnce(
    new ApiError(502, "승인 실패", { errorCode: "PAYMENT_502_TOSS_CONFIRM_FAILED" }),
  );

  await renderPage(QUERY);

  expect(screen.getByRole("alert")).toBeDefined();
  expect(screen.getByText("결제 확인이 끝나지 않았어요")).toBeDefined();
  expect(screen.getByText("ORD-20260919-000001")).toBeDefined();
});

// 금액이 어긋난 것은 사용자가 알아야 할 다른 사실이라 문구를 가른다
test("금액이 어긋나면 그 사유로 알린다", async () => {
  confirmPayment.mockRejectedValueOnce(
    new ApiError(400, "금액 불일치", { errorCode: "PAYMENT_400_AMOUNT_MISMATCH" }),
  );

  await renderPage(QUERY);

  expect(screen.getByText("결제 금액이 맞지 않아요")).toBeDefined();
});

/**
 * **일반 실패 문구를 쓰지 않는다.** 네트워크 오류는 평소 "네트워크 상태를 확인해 주세요"로
 * 떨어지는데, 이 화면에서 그 말은 다시 시도하라는 뜻으로 읽혀 두 번 결제로 이어진다.
 */
test("결제와 무관한 오류도 승인 실패 문구로 모은다", async () => {
  confirmPayment.mockRejectedValueOnce(new TypeError("Failed to fetch"));

  await renderPage(QUERY);

  expect(screen.getByText("결제 확인이 끝나지 않았어요")).toBeDefined();
  expect(screen.queryByText("네트워크 상태를 확인해 주세요.")).toBeNull();
});

// 주소창으로 직접 들어온 경우다. 승인을 부를 값이 없으니 부르지 않는다
test("결제 파라미터가 없으면 승인을 부르지 않는다", async () => {
  await renderPage({});

  expect(confirmPayment).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).toBeNull();
});

// 금액이 숫자가 아니면 승인 본문이 깨진다. 부르기 전에 막는다
test("금액이 숫자가 아니면 승인을 부르지 않는다", async () => {
  await renderPage({ ...QUERY, amount: "열두세개" });

  expect(confirmPayment).not.toHaveBeenCalled();
});
