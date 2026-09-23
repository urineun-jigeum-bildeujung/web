// 성분과 점수가 따로 오는 경우에 글자가 빠진 문장이 남지 않는지 본다.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProductDetailInfo } from "@/entities/product";

import type { PetMatch } from "../model/mock-product";
import { ProductInfoPanel } from "./product-info-panel";

const DETAIL: ProductDetailInfo = {
  manufacturer: "대한펫푸드",
  brandName: "포포도그",
  originCountry: "대한민국",
  netQuantityValue: 90,
  netQuantityUnit: "정",
  ingredients: ["타우린", "글루코사민"],
  feedingTarget: "8세 이상",
  targetBreedSize: "소형·중형견",
  targetAgeGroup: "SENIOR",
  targetSpecies: ["DOG"],
  feedingMethod: "1일 1정, 사료와 함께 급여",
  allergens: [{ code: "EGG", displayName: "계란", severity: "CRITICAL" }],
  cautions: ["HIGH_SODIUM"],
  consumptionPeriodDisplay: "제조일로부터 18개월",
  shelfLifeAfterOpeningDays: 60,
  storageMethod: "직사광선을 피해 서늘하고 건조한 곳에 보관",
};

const BASE: PetMatch = {
  petId: "1",
  petName: "소리",
  score: 92,
  profileLabel: "말티즈 · 8세 · 4kg",
  reasons: [],
  nutrients: [{ name: "단백질", valueLabel: "28%", position: 0.5, properRange: [0.3, 0.7] }],
  functions: "관절 건강",
  summary: "꾸준히 급여하기 좋은 상품이에요",
};

describe("종합 점수 카드", () => {
  it("영양 성분 상태의 부족·적정·과다 범례를 보여준다", () => {
    render(
      <ProductInfoPanel
        detail={DETAIL}
        productName="면역 지원 영양제 90정"
        match={BASE}
        petName="소리"
      />,
    );

    const legend = within(screen.getByRole("list", { name: "영양 성분 상태 범례" }));
    expect(legend.getByText("부족")).toBeDefined();
    expect(legend.getByText("적정")).toBeDefined();
    expect(legend.getByText("과다")).toBeDefined();
  });

  it("점수와 한 줄이 다 있으면 보인다", () => {
    render(
      <ProductInfoPanel
        detail={DETAIL}
        productName="면역 지원 영양제 90정"
        match={BASE}
        petName="소리"
      />,
    );

    expect(screen.getByText(/종합 92점/)).toBeDefined();
  });

  // 성분은 받았는데 종합 점수를 못 받는 경우가 있다. 그대로 그리면
  // "종합 점 — "처럼 글자가 빠진 문장이 화면에 남는다
  it("점수가 없으면 카드를 그리지 않는다", () => {
    render(
      <ProductInfoPanel
        detail={DETAIL}
        productName="면역 지원 영양제 90정"
        match={{ ...BASE, score: null, summary: null }}
        petName="소리"
      />,
    );

    expect(screen.queryByText(/종합/)).toBeNull();
    expect(screen.queryByText(/기능성 성분/)).toBeNull();
    // 성분 막대는 그대로 보인다
    expect(screen.getByText("28%")).toBeDefined();
  });

  it("한 줄만 비어도 카드를 그리지 않는다", () => {
    render(
      <ProductInfoPanel
        detail={DETAIL}
        productName="면역 지원 영양제 90정"
        match={{ ...BASE, summary: null }}
        petName="소리"
      />,
    );

    expect(screen.queryByText(/종합/)).toBeNull();
    expect(screen.queryByText(/기능성 성분/)).toBeNull();
  });

  it("성분이 없으면 아이 이름으로 이유를 알린다", () => {
    render(
      <ProductInfoPanel
        detail={DETAIL}
        productName="면역 지원 영양제 90정"
        match={{ ...BASE, nutrients: [] }}
        petName="냥이"
      />,
    );

    expect(screen.getByText(/냥이 기준의 급여량이/)).toBeDefined();
  });
});

describe("상품정보 하단 안내", () => {
  it("세 항목이 내용 유무와 관계없이 펼쳐지고 다시 접힌다", () => {
    render(<ProductInfoPanel detail={DETAIL} productName="면역 지원 영양제 90정" match={BASE} />);

    const noticeTrigger = screen.getByRole("button", { name: "상품정보 제공고시" });
    fireEvent.click(noticeTrigger);
    expect(noticeTrigger.getAttribute("aria-expanded")).toBe("true");

    const shippingTrigger = screen.getByRole("button", { name: "배송 안내" });
    fireEvent.click(shippingTrigger);
    expect(shippingTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(noticeTrigger.getAttribute("aria-expanded")).toBe("false");

    const returnsTrigger = screen.getByRole("button", { name: "교환/반품/환불 안내" });
    fireEvent.click(returnsTrigger);
    expect(returnsTrigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(returnsTrigger);
    expect(returnsTrigger.getAttribute("aria-expanded")).toBe("false");
  });
});
