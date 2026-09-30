// 담김 스낵바에 되돌리기가 붙는 때와, 누르면 되돌리고 알리는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { custom: vi.fn(), dismiss: vi.fn() } }));

import { showCartAddedSnackbar } from "./cart-added-snackbar";

/** n번째로 띄운 스낵바를 그린다. sonner는 토스트 id를 넘겨 그림을 받는다 */
function renderSnackbar(index: number) {
  const draw = vi.mocked(toast.custom).mock.calls[index][0];
  return render(draw(index));
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("showCartAddedSnackbar", () => {
  it("되돌릴 수 있으면 담기 취소가 붙고, 누르면 되돌린 뒤 취소했다고 알린다", () => {
    const undo = vi.fn();

    showCartAddedSnackbar(undo);
    const { unmount } = renderSnackbar(0);
    expect(screen.getByRole("status").textContent).toContain("상품이 장바구니에 담겼어요");

    fireEvent.click(screen.getByRole("button", { name: "담기 취소" }));

    expect(undo).toHaveBeenCalledOnce();
    expect(toast.dismiss).toHaveBeenCalledWith(0);
    unmount();
    renderSnackbar(1);
    expect(screen.getByRole("status").textContent).toContain("장바구니 담기를 취소했어요");
  });

  // 담기 전 수량을 모르면 되돌릴 기준이 없다. 버튼만 달면 눌러도 엉뚱하게 되돌린다
  it("되돌릴 수 없으면 문구만 띄운다", () => {
    showCartAddedSnackbar(undefined);
    renderSnackbar(0);

    expect(screen.getByRole("status").textContent).toContain("상품이 장바구니에 담겼어요");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
