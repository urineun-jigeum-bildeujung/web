// 약관 문서 테스트. 시행일과 목차가 보이고, 목차가 제 조항을 가리키는지 본다.
import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";

import { PolicyDocument, type PolicySection } from "./policy-document";

const SECTIONS: PolicySection[] = [
  { id: "article-1", title: "제1조 (목적)", paragraphs: ["이 약관은 목적을 정한다."] },
  { id: "article-2", title: "제2조 (정의)", items: ["회원", "아이"] },
];

test("시행일과 조항 제목·본문을 그린다", () => {
  render(<PolicyDocument effectiveDate="2026년 9월 1일" sections={SECTIONS} />);

  expect(screen.getByText("시행일 2026년 9월 1일")).toBeDefined();
  const second = screen.getByRole("region", { name: "제2조 (정의)" });
  expect(
    within(second)
      .getAllByRole("listitem")
      .map((item) => item.textContent),
  ).toEqual(["회원", "아이"]);
  expect(screen.getByText("이 약관은 목적을 정한다.")).toBeDefined();
});

test("목차의 항목은 같은 문서의 그 조항으로 간다", () => {
  render(<PolicyDocument effectiveDate="2026년 9월 1일" sections={SECTIONS} />);

  const toc = screen.getByRole("navigation", { name: "목차" });
  const link = within(toc).getByRole("link", { name: "제2조 (정의)" });
  expect(link.getAttribute("href")).toBe("#article-2");
  expect(document.getElementById("article-2")).toBe(
    screen.getByRole("region", { name: "제2조 (정의)" }),
  );
});
