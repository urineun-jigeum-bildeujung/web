// 주소 검색 테스트. 검색 전후 상태와 선택 조건을 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { SearchAddressView } from "./search-address-view";

test("검색 전에는 결과 대신 입력 예시를 보여준다", () => {
  render(<SearchAddressView />);

  // 시안(mypa_312_입력전)의 안내. 어떻게 찾는지 알려 준다.
  expect(screen.getByText("예) 연희동 42-18")).toBeDefined();
  expect(screen.queryByText("06133")).toBeNull();
});

test("검색어가 없으면 검색 버튼이 꺼져 있다", () => {
  render(<SearchAddressView />);
  expect((screen.getByRole("button", { name: "검색" }) as HTMLButtonElement).disabled).toBe(true);
});

test("검색하면 결과를 보여주고 고르면 완료가 켜진다", () => {
  render(<SearchAddressView />);

  fireEvent.change(screen.getByLabelText("주소 검색어"), { target: { value: "테헤란로" } });
  fireEvent.click(screen.getByRole("button", { name: "검색" }));

  const submit = screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement;
  expect(submit.disabled).toBe(true);

  fireEvent.click(screen.getAllByText("06133")[0]);
  expect(submit.disabled).toBe(false);
});
