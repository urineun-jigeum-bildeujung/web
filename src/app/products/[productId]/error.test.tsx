// 상세 라우트가 실패했을 때 **돌아갈 길이 남는지**를 본다. 문구가 뜨는 것보다 그것이 이 화면의 값이다 (#620).
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";

// 머리말의 두 위젯은 서버 상태를 읽는다. 이 테스트에는 QueryClient가 없어 링크만 대신 그린다
// (home-view.test.tsx와 같은 처리, #395·#470)
vi.mock("@/widgets/notification-bell", () => ({
  NotificationBell: () => <a href="/mypage/notifications" aria-label="알림" />,
}));
vi.mock("@/widgets/cart-link", () => ({
  CartLink: () => <a href="/cart" aria-label="장바구니" />,
}));

const { reportError } = vi.hoisted(() => ({ reportError: vi.fn() }));
vi.mock("@/shared/lib/report-error", () => ({ reportError }));

// 기본 뒤로가기는 라우터를 쓴다. 기록이 없으면 홈으로 가는 것은 PageHeader 쪽 책임이라 여기서 보지 않는다
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }));

import ProductDetailError from "./error";

const MESSAGE = APP_MESSAGE[APP_MESSAGE_CODE.common.routeError];

function renderError(reset = vi.fn()) {
  render(<ProductDetailError error={new Error("조회 실패")} reset={reset} />);
  return reset;
}

// 이 테스트가 막는 회귀다 — 경계가 없던 동안 전역 오류 화면이 머리말째 덮어 링크가 하나도 없었다
it("실패해도 머리말이 남아 나갈 길이 있다", () => {
  renderError();

  expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeDefined();
  expect(screen.getByRole("link", { name: "알림" })).toBeDefined();
  expect(screen.getByRole("link", { name: "장바구니" })).toBeDefined();
});

// 실패했을 때도 낭독기가 머리말을 지나 본문으로 건너뛸 수 있어야 한다
it("본문 랜드마크를 둔다", () => {
  renderError();

  expect(screen.getByRole("main")).toBeDefined();
});

it("전역 오류 화면과 같은 문구를 쓴다", () => {
  renderError();

  const alert = screen.getByRole("alert");
  expect(alert.textContent).toContain(MESSAGE.title);
  // 설명은 시안대로 두 줄이라 줄바꿈이 들어 있다. 앞 줄만 보고 같은 문구인지 가린다
  expect(alert.textContent).toContain(MESSAGE.description.split("\n")[0]);
});

it("다시 시도하기를 누르면 세그먼트를 다시 그린다", () => {
  const reset = renderError();

  fireEvent.click(screen.getByRole("button", { name: "다시 시도하기" }));

  expect(reset).toHaveBeenCalledOnce();
});

// 원인은 로그로만 남긴다. 화면에 내보내면 사용자가 읽을 수 없는 말이 뜬다
it("오류 원인을 화면에 적지 않고 로그로만 남긴다", () => {
  reportError.mockClear();
  renderError();

  expect(reportError).toHaveBeenCalledWith("product detail route error", expect.any(Error));
  expect(screen.queryByText(/조회 실패/)).toBeNull();
});
