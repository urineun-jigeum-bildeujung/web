// 사진 모음 테스트. 격자에서 상세로 가는 길과 주소로 들어왔을 때를 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  usePathname: () => "/products/1/photos",
}));

import { ProductPhotosView } from "./product-photos-view";

function renderView(search = "") {
  render(
    <NuqsTestingAdapter searchParams={search}>
      <ProductPhotosView productId="1" />
    </NuqsTestingAdapter>,
  );
}

describe("ProductPhotosView", () => {
  it("사진이 있는 후기만 격자로 모인다", () => {
    renderView();

    // 목데이터에서 사진이 달린 후기는 둘, 각 3장이다
    expect(screen.getAllByRole("button", { name: /크게 보기/ })).toHaveLength(6);
    expect(screen.getByText("6장")).toBeDefined();
  });

  it("사진을 누르면 그 사진을 남긴 후기가 함께 열린다", () => {
    renderView();

    fireEvent.click(screen.getAllByRole("button", { name: /크게 보기/ })[0]);

    const viewer = screen.getByRole("dialog");
    expect(viewer).toBeDefined();
    // 사진만 보고는 왜 찍었는지 알 수 없다. 후기가 함께 와야 한다
    expect(viewer.textContent).toContain("댕댕이짱");
    expect(viewer.textContent).toContain("말티즈 · 8세 · 4kg");
  });

  it("주소로 바로 들어와도 그 사진이 열린다", () => {
    renderView("?review=1&photo=2");

    const viewer = screen.getByRole("dialog");
    expect(viewer.textContent).toContain("구름아사랑해");
    expect(screen.getByText("3장 중 3번째")).toBeDefined();
  });

  it("마지막 사진에서는 다음으로 갈 수 없다", () => {
    renderView("?review=0&photo=2");

    expect(screen.getByRole("button", { name: "다음 사진" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "이전 사진" }).hasAttribute("disabled")).toBe(false);
  });

  // 주소는 사람이 고칠 수 있다
  it("없는 후기를 가리키면 상세를 열지 않는다", () => {
    renderView("?review=99");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("범위를 벗어난 사진 번호는 끝으로 잘린다", () => {
    renderView("?review=0&photo=99");

    expect(screen.getByText("3장 중 3번째")).toBeDefined();
  });

  it("닫으면 격자로 돌아온다", () => {
    renderView("?review=0&photo=0");
    expect(screen.getByRole("dialog")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
