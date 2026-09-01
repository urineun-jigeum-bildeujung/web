// 비교표 테스트. 눈으로는 라벨이 가운데 있지만, 읽을 때는 어느 상품의 값인지 알 수 있어야 한다.
import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";

import { CompareTable, type CompareRow } from "./compare-table";

const ROWS: CompareRow[] = [
  { label: "10g당 가격", values: ["150원", "176원"] },
  {
    label: "주요 영양 비율",
    values: [
      ["조단백 30%", "조지방 10%"],
      ["조단백 24%", "조지방 14%"],
    ],
  },
];

function renderTable() {
  render(<CompareTable productNames={["연어 사료", "오리 사료"]} rows={ROWS} />);
}

test("어느 상품을 견주는지 읽힌다", () => {
  renderTable();
  expect(screen.getByRole("table", { name: /연어 사료와 오리 사료 비교/ })).toBeDefined();
});

test("항목 이름이 그 줄의 머리글이 된다", () => {
  renderTable();

  // scope=row라 스크린 리더가 값을 읽을 때 항목 이름을 함께 알린다
  expect(screen.getByRole("rowheader", { name: "10g당 가격" })).toBeDefined();
  expect(screen.getByRole("rowheader", { name: "주요 영양 비율" })).toBeDefined();
});

test("두 상품의 값이 좌우로 놓인다", () => {
  renderTable();

  const row = screen.getByRole("rowheader", { name: "10g당 가격" }).closest("tr")!;
  const cells = within(row).getAllByRole("cell");
  expect(cells[0].textContent).toBe("150원");
  expect(cells[1].textContent).toBe("176원");
});

test("여러 줄로 된 값은 줄을 나눠 보여준다", () => {
  renderTable();

  const row = screen.getByRole("rowheader", { name: "주요 영양 비율" }).closest("tr")!;
  const cells = within(row).getAllByRole("cell");
  expect(cells[0].textContent).toBe("조단백 30%조지방 10%");
});
