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

// 모르는 채로 누르면 토글이 서버의 찜을 지울 수 있다 (#493 리뷰)
it("찜 여부를 받는 동안은 누를 수 없고 대기를 알린다", () => {
  const onToggle = vi.fn();
  render(<CardHeartButton name="덴탈껌" wished={false} loading onToggle={onToggle} />);

  const button = screen.getByRole("button", { name: "덴탈껌 찜하기" });
  expect(button).toHaveProperty("disabled", true);
  expect(screen.getByRole("status", { name: "찜 여부를 불러오는 중" })).toBeDefined();
  fireEvent.click(button);
  expect(onToggle).not.toHaveBeenCalled();
});
