// 가격 표시 단위 테스트. 할인율 계산과 표기 조건을 검증한다.
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { calcDiscountRate, formatWon, Price } from "./price";

describe("calcDiscountRate", () => {
  test("할인율을 버림으로 계산한다", () => {
    // 19.9%를 20%로 올리면 실제보다 싸 보인다
    expect(calcDiscountRate(8010, 10000)).toBe(19);
    expect(calcDiscountRate(8000, 10000)).toBe(20);
  });

  test("정가가 더 싸거나 같으면 0이다", () => {
    expect(calcDiscountRate(10000, 10000)).toBe(0);
    expect(calcDiscountRate(12000, 10000)).toBe(0);
  });

  test("정가가 0 이하면 0이다", () => {
    expect(calcDiscountRate(1000, 0)).toBe(0);
  });
});

describe("formatWon", () => {
  test("천 단위를 끊고 원을 붙인다", () => {
    expect(formatWon(31200)).toBe("31,200원");
    expect(formatWon(0)).toBe("0원");
  });
});

describe("Price", () => {
  // 서버는 반올림(HALF_UP)하고 calcDiscountRate는 버림이라 같은 금액에서 값이 갈린다.
  // 계약이 있는 값을 화면이 다시 만들면 서버 표기와 어긋난다 (#413)
  test("할인율을 받으면 금액으로 계산하지 않고 그 값을 쓴다", () => {
    render(<Price amount={8010} originalAmount={10000} discountRate={20} />);

    expect(screen.getByText("20%")).toBeDefined();
    expect(screen.queryByText("19%")).toBeNull();
  });

  test("할인율이 0으로 오면 취소선도 할인율도 그리지 않는다", () => {
    render(<Price amount={10000} originalAmount={10000} discountRate={0} />);

    expect(screen.queryByText("0%")).toBeNull();
    expect(screen.getByText("10,000원")).toBeDefined();
  });

  test("할인이 없으면 금액만 보여준다", () => {
    render(<Price amount={31200} />);

    expect(screen.getByText("31,200원")).toBeDefined();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  test("할인이 있으면 할인율과 정가를 함께 보여준다", () => {
    render(<Price amount={8000} originalAmount={10000} />);

    expect(screen.getByText("20%")).toBeDefined();
    expect(screen.getByText("8,000원")).toBeDefined();
    expect(screen.getByText("10,000원")).toBeDefined();
  });

  test("단가를 라벨과 함께 보여준다", () => {
    render(<Price amount={31200} unitLabel="하루 급여" unitAmount={480} />);
    expect(screen.getByText("하루 급여 480원")).toBeDefined();
  });
});
