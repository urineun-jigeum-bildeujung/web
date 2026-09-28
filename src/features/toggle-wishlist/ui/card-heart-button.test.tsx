// CardHeartButton 테스트. 찜 여부를 눌림 상태로 알리고, 누르면 토글을 부르는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { CardHeartButton } from "./card-heart-button";

it("찜했으면 눌린 하트로 알린다", () => {
  render(<CardHeartButton name="덴탈껌" wished onToggle={() => {}} />);

  expect(screen.getByRole("button", { name: "덴탈껌 찜하기" }).getAttribute("aria-pressed")).toBe(
    "true",
  );
});

it("누르면 토글을 부른다", () => {
  const onToggle = vi.fn();
  render(<CardHeartButton name="덴탈껌" wished={false} onToggle={onToggle} />);

  const button = screen.getByRole("button", { name: "덴탈껌 찜하기" });
  expect(button.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(button);
  expect(onToggle).toHaveBeenCalledOnce();
});
