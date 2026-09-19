// 상품 설명의 미리보기와 전체 펼침·접기 동작을 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DescriptionCollapse } from "./description-collapse";

describe("DescriptionCollapse", () => {
  it("접힌 상태로 시작해 누르면 펼쳐진 상태로 바뀐다", () => {
    const { container } = render(<DescriptionCollapse />);

    const toggle = screen.getByRole("button", { name: "상품설명 더보기" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    const description = document.getElementById(toggle.getAttribute("aria-controls")!);
    expect(description?.className).toContain("max-h-100.5");
    expect(description?.firstElementChild?.className).toContain("aspect-[353/5609]");
    expect(container.querySelector(".bg-gradient-to-b")).not.toBeNull();

    fireEvent.click(toggle);

    const collapse = screen.getByRole("button", { name: "상품설명 접기" });
    expect(collapse.getAttribute("aria-expanded")).toBe("true");
    expect(description?.className).toContain("max-h-none");
    expect(container.querySelector(".bg-gradient-to-b")).toBeNull();

    fireEvent.click(collapse);
    expect(screen.getByRole("button", { name: "상품설명 더보기" })).toBeDefined();
    expect(description?.className).toContain("max-h-100.5");
  });
});
