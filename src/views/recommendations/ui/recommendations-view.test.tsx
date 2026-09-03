// 적합도가 점수만이 아니라 문장으로도 읽히는지, 아이를 바꿀 수 있는지 본다.
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

import { RecommendationsView } from "./recommendations-view";

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <RecommendationsView />
    </NuqsTestingAdapter>,
  );
}

describe("RecommendationsView", () => {
  it("어느 아이 기준인지 고를 수 있다", () => {
    renderWith();
    expect(screen.getByLabelText("어느 아이의 추천을 볼지")).toBeDefined();
  });

  it("주소로 받은 아이가 적합도 문장에 들어간다", () => {
    renderWith("?pet=2");

    // 점수만 보여주면 누구 기준인지 알 수 없다
    expect(screen.getAllByText(/봄이와 잘 맞아요/)[0]).toBeDefined();
  });

  it("무엇을 근거로 골랐는지 알린다", () => {
    renderWith();
    expect(screen.getByText(/건강 고민을 바탕으로 추천해요/)).toBeDefined();
  });
});
