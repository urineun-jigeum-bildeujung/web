// 아이콘 단위 테스트. 모든 이름이 그려지는지와 접근성 속성을 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { Icon } from "./icon";
import { ICON_NAMES } from "./icon-shapes";

test("Figma 아이콘 페이지의 이름을 전부 그린다", () => {
  // count 배지가 붙는 cart_noti는 아이콘이 아니라 조합이라 뺐다.
  // 2026-09-18에 PD팀이 refresh·pencil·404·reload·bag 다섯을 더해 51종, 2026-09-21에 camera·image로 53종이 됐다
  expect(ICON_NAMES).toHaveLength(53);

  for (const name of ICON_NAMES) {
    const { container, unmount } = render(<Icon name={name} />);
    expect(container.querySelector("path")).not.toBeNull();
    unmount();
  }
});

test("기본은 장식이라 스크린 리더에서 숨긴다", () => {
  const { container } = render(<Icon name="search" />);

  const svg = container.querySelector("svg")!;
  expect(svg.getAttribute("aria-hidden")).toBe("true");
  expect(svg.getAttribute("role")).toBeNull();
});

test("label을 주면 이름 있는 이미지로 읽힌다", () => {
  render(<Icon name="search" label="검색" />);
  expect(screen.getByRole("img", { name: "검색" })).toBeDefined();
});

test("크기와 색은 className으로 정한다", () => {
  const { container } = render(<Icon name="plus" className="size-4 text-icon-fill-brand" />);

  const svg = container.querySelector("svg")!;
  // size-6 기본값이 호출부 값으로 바뀐다
  expect(svg.getAttribute("class")).toContain("size-4");
  expect(svg.getAttribute("class")).not.toContain("size-6");
  expect(svg.getAttribute("fill")).toBe("currentColor");
});

test("벡터만 내보낸 아이콘은 24×24 상자 안 제자리로 옮긴다", () => {
  const { container } = render(<Icon name="plus" />);

  // 시안에서 plus는 상자의 17.71% 안쪽에 15.5px로 놓인다
  expect(container.querySelector("g")?.getAttribute("transform")).toContain("translate(4.25 4.25)");
});
