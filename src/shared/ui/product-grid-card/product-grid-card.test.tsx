// 고르는 모드(selectable)의 카드가 그리드 칸 너비를 채우는지 본다.
// button은 div와 달리 width:auto가 내용에 맞춰 줄어들어(폼 컨트롤의 내재적 크기 규칙),
// w-full이 빠지면 같은 그리드 안에서도 카드마다 이미지 크기가 들쭉날쭉해진다.
import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";

import { ProductGridCard } from "./product-grid-card";

test("고르는 모드 카드는 폭이 줄어들지 않도록 w-full을 갖는다", () => {
  render(<ProductGridCard name="연어 사료 1kg" price={31500} selectable />);

  expect(screen.getByRole("button").className).toContain("w-full");
});

// 부모가 items-start 세로 flex라 폭을 묶지 않으면 truncate가 걸리지 않고 옆 카드까지 넘친다.
// 홈 타임딜 줄에서 160px 카드의 이름이 176px로 그려졌다 (#479)
test("말줄임할 이름·옵션 줄은 폭을 카드에 묶는다", () => {
  render(<ProductGridCard name="연어&감자 그레인프리 사료 2kg" option="2kg" price={21800} />);

  expect(screen.getByText("연어&감자 그레인프리 사료 2kg").className).toContain("max-w-full");
  expect(screen.getByText("2kg").className).toContain("max-w-full");
});

// 카드는 화면 폭의 절반 이하다. sizes가 없으면 브라우저가 화면 폭만 한 이미지를 받는다 (#479)
test("사진에 카드 크기에 맞는 sizes를 준다", () => {
  const { container } = render(
    <ProductGridCard
      name="연어 사료 1kg"
      price={31500}
      imageUrl="https://image.leechs.shop/p.png"
    />,
  );

  expect(container.querySelector("img")?.getAttribute("sizes")).toBe(
    "(min-width: 768px) 240px, 50vw",
  );
});

// 할인율은 서버가 HALF_UP으로 반올림하고 calcDiscountRate는 버림이라 값이 갈린다.
// 19,900 → 15,000은 서버 25%, 버림 24%다 — 어느 쪽을 쓰는지 케이스로 가른다.
test("서버 할인율을 주면 두 금액에서 계산하지 않고 그 값을 보여준다", () => {
  render(
    <ProductGridCard name="연어 사료 1kg" price={15000} originalPrice={19900} discountRate={25} />,
  );

  expect(screen.getByText("25%")).toBeDefined();
  expect(screen.getByText("19,900원")).toBeDefined();
});

test("서버 할인율이 없으면 두 금액에서 버림으로 계산한다", () => {
  render(<ProductGridCard name="연어 사료 1kg" price={15000} originalPrice={19900} />);

  expect(screen.getByText("24%")).toBeDefined();
});

// 0도 서버가 준 계약값이다. 두 금액 차이로 되살리면 할인 아닌 상품에 배지가 붙는다
test("서버 할인율이 0이면 두 금액 차이로 다시 계산하지 않는다", () => {
  render(
    <ProductGridCard name="연어 사료 1kg" price={15000} originalPrice={19900} discountRate={0} />,
  );

  expect(screen.queryByText("24%")).toBeNull();
  expect(screen.queryByText("19,900원")).toBeNull();
});

test("정가가 없으면 취소선 정가를 보여주지 않는다", () => {
  const { container } = render(
    <ProductGridCard name="연어 사료 1kg" price={15000} discountRate={25} />,
  );

  expect(screen.getByText("15,000원")).toBeDefined();
  expect(container.querySelector(".line-through")).toBeNull();
});
