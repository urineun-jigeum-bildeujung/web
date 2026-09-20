// 스낵바가 sonner의 toast.custom을 올바른 문구·옵션으로 부르는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const { custom } = vi.hoisted(() => ({ custom: vi.fn() }));
vi.mock("sonner", () => ({ toast: { custom } }));

import { showSnackbar, SNACKBAR_OPTIONS } from "./snackbar";

test("문구를 담아 pointer-events-none 옵션으로 띄운다", () => {
  showSnackbar("장바구니에 담겼어요");

  expect(custom).toHaveBeenCalledWith(expect.any(Function), SNACKBAR_OPTIONS);

  const [render_] = custom.mock.calls[0];
  render(render_());
  expect(screen.getByRole("status").textContent).toBe("장바구니에 담겼어요");
});
