// 404 화면 테스트. 길을 잃은 사람에게 무엇을 알리고 어디로 보내는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { NotFoundView } from "./not-found-view";

test("무엇이 잘못됐는지 알린다", () => {
  render(<NotFoundView />);

  expect(screen.getByRole("heading", { name: "앗, 길을 잘못 드신 것 같아요" })).toBeDefined();
});

// 시안 문구가 "제가 다시 홈으로 안내해 드릴게요"다. 뒤로 보내면 없는 주소로 되돌아갈 수 있다
test("돌아가기는 홈으로 보낸다", () => {
  render(<NotFoundView />);

  const link = screen.getByRole("link", { name: "돌아가기" }) as HTMLAnchorElement;
  expect(link.getAttribute("href")).toBe("/");
});
