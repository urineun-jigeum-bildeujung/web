// 성분과 점수가 따로 오는 경우에 글자가 빠진 문장이 남지 않는지 본다.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  targetBreedSize: "소형",
  targetAgeGroup: "노령",
  targetSpecies: ["강아지"],
  feedingMethod: "1일 1정, 사료와 함께 급여",
  allergens: [{ code: "EGG", displayName: "계란", severity: "CRITICAL" }],
  cautions: ["고염분"],
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

describe("상세 설명 표", () => {
  it("영양 분석 대기 중에는 예시값 대신 뼈대를 그린다", () => {
    render(<ProductInfoPanel detail={DETAIL} match={BASE} nutritionLoading />);
    expect(screen.getByRole("status", { name: "영양 분석을 불러오는 중" })).toBeDefined();
    expect(screen.queryByText("28%")).toBeNull();
    expect(screen.getByText("종합 92점")).toBeDefined();
    expect(screen.getByText("기능성 성분 - 관절 건강")).toBeDefined();
  });

  it("분석 실패 시 예시값을 숨기고 다시 시도한다", () => {
    const retry = vi.fn();
    render(
      <ProductInfoPanel detail={DETAIL} match={BASE} nutritionFailed onRetryNutrition={retry} />,
    );
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.queryByText("28%")).toBeNull();
    expect(screen.getByText("종합 92점")).toBeDefined();
    expect(screen.getByText("기능성 성분 - 관절 건강")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(retry).toHaveBeenCalledOnce();
  });
  // 종은 체구 뒤에 접미로 붙는다(시안 1702-18844). 응답은 "강아지"·"고양이" 표시명으로 온다
  it("급여 대상을 체구 뒤에 종 접미를 붙여 한 문구로 적는다", () => {
    render(<ProductInfoPanel detail={DETAIL} match={BASE} />);

    expect(screen.getByText("8세 이상 소형견")).toBeDefined();
  });

  // 응답의 allergens는 들어 있는 성분이다. 성분명만 적으면 시안 문구("불포함") 때문에
  // 뜻이 정반대로 읽힌다
  it("알레르기 성분 뒤에 포함을 붙인다", () => {
    render(<ProductInfoPanel detail={DETAIL} match={BASE} />);

    expect(screen.getByText("계란 포함")).toBeDefined();
  });

  it("비어 오는 항목은 줄째로 빼고 그린다", () => {
    render(
      <ProductInfoPanel
        detail={{ ...DETAIL, originCountry: null, storageMethod: null }}
        match={BASE}
      />,
    );

    expect(screen.queryByText("제조국")).toBeNull();
    expect(screen.queryByText("보관방법")).toBeNull();
    expect(screen.getByText("대한펫푸드 / 포포도그")).toBeDefined();
  });
});

describe("종합 점수 카드", () => {
  it("영양 성분 상태의 부족·적정·과다 범례를 보여준다", () => {
    render(<ProductInfoPanel detail={DETAIL} match={BASE} petName="소리" />);

    const legend = within(screen.getByRole("list", { name: "영양 성분 상태 범례" }));
    expect(legend.getByText("부족")).toBeDefined();
    expect(legend.getByText("적정")).toBeDefined();
    expect(legend.getByText("과다")).toBeDefined();
  });

  it("점수와 한 줄이 다 있으면 보인다", () => {
    render(<ProductInfoPanel detail={DETAIL} match={BASE} petName="소리" />);

    expect(screen.getByText(/종합 92점/)).toBeDefined();
  });

  // 성분은 받았는데 종합 점수를 못 받는 경우가 있다. 그대로 그리면
  // "종합 점 — "처럼 글자가 빠진 문장이 화면에 남는다
  it("점수가 없으면 카드를 그리지 않는다", () => {
    render(
      <ProductInfoPanel
        detail={DETAIL}
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
    render(<ProductInfoPanel detail={DETAIL} match={{ ...BASE, summary: null }} petName="소리" />);

    expect(screen.queryByText(/종합/)).toBeNull();
    expect(screen.queryByText(/기능성 성분/)).toBeNull();
  });

  // 이유를 지어내지 않는다. 예전 문구("급여량이 등록되지 않아")는 종이 달라 재지 않은 아이에게도 떴다 (#481)
  it("성분이 없으면 그 아이 기준으로는 아직 분석하지 못했다고 알린다", () => {
    render(<ProductInfoPanel detail={DETAIL} match={{ ...BASE, nutrients: [] }} petName="냥이" />);

    expect(screen.getByText("냥이 기준으로는 아직 분석하지 못했어요.")).toBeDefined();
  });
});

describe("상품정보 하단 안내", () => {
  // 아코디언이 닫혀 있는 동안에는 본문이 DOM에 없다. 단정 전에 그 항목을 펼친다
  function openGuide(name: string) {
    fireEvent.click(screen.getByRole("button", { name }));
  }

  it("세 항목이 내용 유무와 관계없이 펼쳐지고 다시 접힌다", () => {
    render(<ProductInfoPanel detail={DETAIL} match={BASE} />);

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

  it("세 항목 모두 자리표시가 아니라 실제 안내 문구를 그린다", () => {
    render(<ProductInfoPanel detail={DETAIL} match={BASE} />);

    openGuide("상품정보 제공고시");
    expect(screen.getByText("1. 기본 상품 정보")).toBeDefined();

    openGuide("배송 안내");
    expect(screen.getByText("3. 출고 마감 및 배송 소요일 (빠른출발 안내)")).toBeDefined();

    openGuide("교환/반품/환불 안내");
    expect(screen.getByText("1. 교환 및 반품 신청 기간")).toBeDefined();

    expect(screen.queryByText("안내 내용을 준비하고 있어요.")).toBeNull();
  });

  // 소제목을 랜드마크(`section`)로 감싸면 안내 하나에 region이 열다섯 개씩 생겨
  // 낭독기 탐색이 도리어 복잡해진다. 아코디언 줄이 h3이므로 그 아래는 h4다
  it("소제목을 랜드마크가 아니라 제목 요소로 그린다", () => {
    render(<ProductInfoPanel detail={DETAIL} match={BASE} />);
    openGuide("상품정보 제공고시");

    expect(screen.getByRole("heading", { level: 4, name: "1. 기본 상품 정보" })).toBeDefined();
    expect(screen.queryAllByRole("region", { name: "1. 기본 상품 정보" })).toHaveLength(0);
  });

  // 품명은 상품 상세 설명으로 넘기고 제공고시에는 서버 값을 쓰지 않는다(PD 확정 · #555).
  // 자리표시용 가짜 상담 번호도 이때 함께 사라졌다 — 되살아나면 운영에 그대로 나간다
  it("제공고시에 서버 값도 자리표시 상담 번호도 넣지 않는다", () => {
    render(<ProductInfoPanel detail={DETAIL} match={BASE} />);
    openGuide("상품정보 제공고시");

    expect(screen.getByText("품명 및 모델명: 상품 상단 및 상세설명 별도 표기")).toBeDefined();
    expect(screen.queryByText(/1234-5678/)).toBeNull();
    expect(screen.queryByText("소비자상담 관련 전화번호")).toBeNull();
  });

  // PD가 조건부 무료배송 줄을 통째로 지워 기본 배송비 줄도 시안에서 사라졌다(#575).
  // 금액은 장바구니·결제가 이미 보인다(3,000원 고정 · #214)
  it("배송비 안내에 무료배송도 기본 배송비 줄도 적지 않는다", () => {
    render(<ProductInfoPanel detail={DETAIL} match={BASE} />);
    openGuide("배송 안내");

    expect(screen.queryByText(/무료배송/)).toBeNull();
    expect(screen.queryByText(/기본 배송비/)).toBeNull();
    expect(screen.getByText(/도서·산간 추가 배송비/)).toBeDefined();
  });
});
