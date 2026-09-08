// 적합도가 아이에 따라 갈리는지, 재지 못한 아이를 0점으로 읽히지 않게 하는지 본다.
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

import { ProductDetailView } from "./product-detail-view";

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <ProductDetailView productId="1" />
    </NuqsTestingAdapter>,
  );
}

describe("ProductDetailView", () => {
  it("가격 아래에 적합도와 근거가 함께 있다", () => {
    renderWith();

    expect(screen.getByRole("heading", { name: "소리와 잘 맞아요" })).toBeDefined();
    expect(screen.getByText("관절 건강에 도움되는 글루코사민이 들어있어요")).toBeDefined();
  });

  // 좋은 말만 있으면 광고와 구별되지 않는다. 지켜볼 것이 같은 자리에 있어야 근거로 읽힌다
  it("지켜볼 점도 같은 자리에 있다", () => {
    renderWith();

    expect(screen.getByText("나트륨 함량이 또래 평균보다 다소 높은 편이에요")).toBeDefined();
  });

  it("탭을 옮기면 그 탭 내용이 나온다", () => {
    renderWith("?tab=qna");

    expect(screen.getByRole("link", { name: "문의하기" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "영양 성분 분석" })).toBeNull();
  });

  it("상품 정보 탭에 영양 성분 분석이 있다", () => {
    renderWith();

    expect(screen.getByRole("heading", { name: "영양 성분 분석" })).toBeDefined();
    expect(screen.getByText("종합 92점 — 소리에게 꾸준히 급여하기 좋은 상품이에요")).toBeDefined();
  });
});
