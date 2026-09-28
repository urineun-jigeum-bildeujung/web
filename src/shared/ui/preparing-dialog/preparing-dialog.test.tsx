// 준비 중 안내창 테스트. 코드가 있을 때만 열리고, 확인을 누르면 닫는다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { APP_MESSAGE } from "@/shared/config/app-message";

import { PreparingDialog } from "./preparing-dialog";

test("코드가 없으면 닫혀 있다", () => {
  render(<PreparingDialog code={null} onClose={vi.fn()} />);

  expect(screen.queryByRole("dialog")).toBeNull();
});

test("코드의 제목과 설명을 띄우고, 확인을 누르면 닫는다", () => {
  const onClose = vi.fn();
  render(<PreparingDialog code="order.deliveryTrackingPreparing" onClose={onClose} />);

  const message = APP_MESSAGE["order.deliveryTrackingPreparing"];
  const dialog = screen.getByRole("dialog", { name: message.title });
  expect(dialog.textContent).toContain(message.description);

  fireEvent.click(screen.getByRole("button", { name: "확인" }));
  expect(onClose).toHaveBeenCalled();
});
