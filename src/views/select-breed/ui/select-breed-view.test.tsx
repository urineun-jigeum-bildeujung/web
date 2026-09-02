// 지금 값이 미리 골라져 있는지, 고르기 전에는 완료를 누를 수 없는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

import { SelectBreedView } from "./select-breed-view";

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <SelectBreedView />
    </NuqsTestingAdapter>,
  );
}

describe("SelectBreedView", () => {
  it("아무것도 고르지 않았으면 선택 완료를 누를 수 없다", () => {
    renderWith();

    expect(screen.getByRole("button", { name: "선택 완료" })).toHaveProperty("disabled", true);
  });

  it("주소로 받은 지금 값이 이미 골라진 상태로 열린다", () => {
    renderWith("?value=" + encodeURIComponent("믹스견 (기타)"));

    expect(screen.getByRole("button", { name: "선택 완료" })).toHaveProperty("disabled", false);
  });

  it("고르면 종까지 함께 돌려준다", () => {
    push.mockClear();
    renderWith();

    fireEvent.click(screen.getByRole("button", { name: "코리안 숏헤어 (코숏)" }));
    fireEvent.click(screen.getByRole("button", { name: "선택 완료" }));

    // 종을 강아지로 고정하면 고양이 선택이 뒤집힌다
    expect(push).toHaveBeenCalledWith(expect.stringContaining("species=cat"));
  });
});
