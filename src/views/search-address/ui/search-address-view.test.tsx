// 주소 검색 테스트. 검색 전후 상태, 선택 조건, 고른 주소를 어떻게 넘기는지 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

import { SearchAddressView } from "./search-address-view";

beforeEach(() => push.mockClear());

const searchFor = (keyword: string) => {
  fireEvent.change(screen.getByLabelText("주소 검색어"), { target: { value: keyword } });
  fireEvent.click(screen.getByRole("button", { name: "검색" }));
};

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

// 행안부 API가 한 글자를 E0008로 거절한다. 보내기 전에 막는지 본다
test("검색어가 한 글자면 검색 버튼이 꺼져 있다", () => {
  render(<SearchAddressView />);

  fireEvent.change(screen.getByLabelText("주소 검색어"), { target: { value: "가" } });
  expect((screen.getByRole("button", { name: "검색" }) as HTMLButtonElement).disabled).toBe(true);

  fireEvent.change(screen.getByLabelText("주소 검색어"), { target: { value: "가나" } });
  expect((screen.getByRole("button", { name: "검색" }) as HTMLButtonElement).disabled).toBe(false);
});

test("검색하면 결과를 보여주고 고르면 완료가 켜진다", () => {
  render(<SearchAddressView />);

  searchFor("테헤란로");

  const submit = screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement;
  expect(submit.disabled).toBe(true);

  fireEvent.click(screen.getAllByText("06133")[0]);
  expect(submit.disabled).toBe(false);
});

// 이 화면의 존재 이유다. 고른 주소가 배송지 화면까지 가지 않으면 아무것도 한 것이 없다
test("고른 주소를 우편번호와 함께 배송지 화면으로 넘긴다", () => {
  render(<SearchAddressView />);

  searchFor("테헤란로");
  fireEvent.click(screen.getAllByText("06133")[0]);
  fireEvent.click(screen.getByRole("button", { name: "입력 완료" }));

  expect(push).toHaveBeenCalledTimes(1);
  const url = new URL(push.mock.calls[0][0], "http://localhost");

  expect(url.pathname).toBe("/mypage/address/new");
  expect(url.searchParams.get("zipNo")).toBe("06133");
  expect(url.searchParams.get("roadAddr")).toBe("서울특별시 강남구 테헤란로 123 (역삼동)");
});

// 검색어를 바꿔 다시 찾았는데 앞서 고른 것이 남아 있으면, 화면에 없는 주소로 넘어간다
test("다시 검색하면 앞서 고른 것이 풀린다", () => {
  render(<SearchAddressView />);

  searchFor("테헤란로");
  fireEvent.click(screen.getAllByText("06133")[0]);
  expect((screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement).disabled).toBe(
    false,
  );

  searchFor("도산대로");
  expect((screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
});
