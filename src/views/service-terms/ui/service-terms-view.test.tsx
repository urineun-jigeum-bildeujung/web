// 서비스 이용약관 테스트. 기능정의서가 적은 시행일·목차·전문이 보이는지 본다.
import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { ServiceTermsView } from "./service-terms-view";

test("시행일과 조항마다의 목차가 보이고, 자리 표시 문구는 없다", () => {
  render(<ServiceTermsView />);

  expect(screen.getByText("시행일 2026년 9월 1일")).toBeDefined();
  const toc = screen.getByRole("navigation", { name: "목차" });
  expect(within(toc).getAllByRole("link").length).toBe(screen.getAllByRole("region").length);
  expect(within(toc).getByRole("link", { name: "제7조 (취소·반품·교환)" })).toBeDefined();
  expect(screen.queryByText(/자리 표시/)).toBeNull();
});

// QA No.138(#621). 가입의 선택 동의 "맞춤 혜택 및 이벤트 알림 수신 동의"를 설명하는 조항이 없었다
test("마케팅 수신 동의 조항이 목차와 본문에 있고 선택 동의라고 밝힌다", () => {
  render(<ServiceTermsView />);

  const toc = screen.getByRole("navigation", { name: "목차" });
  const name = "제9조 (맞춤 혜택 및 이벤트 알림 수신 동의)";
  expect(within(toc).getByRole("link", { name })).toBeDefined();
  expect(screen.getByRole("region", { name }).textContent).toContain(
    "동의하지 않아도 서비스를 이용할 수 있습니다",
  );
});

test("시연용 예시라는 것을 부칙에 밝힌다", () => {
  render(<ServiceTermsView />);

  const addendum = screen.getByRole("region", { name: "부칙" });
  expect(addendum.textContent).toContain("교육 프로젝트 시연을 위해 작성한 예시");
});
