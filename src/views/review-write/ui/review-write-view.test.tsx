// 리뷰 작성 화면 테스트. 전달받은 orderItemId가 보이는지 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { ReviewWriteView } from "./review-write-view";

test("전달받은 orderItemId를 보여준다", () => {
  render(<ReviewWriteView orderItemId="3-1" />);
  expect(screen.getByText(/orderItemId: 3-1/)).toBeDefined();
});

test("orderItemId가 없으면 없다고 표시한다", () => {
  render(<ReviewWriteView orderItemId={undefined} />);
  expect(screen.getByText(/orderItemId: 없음/)).toBeDefined();
});
