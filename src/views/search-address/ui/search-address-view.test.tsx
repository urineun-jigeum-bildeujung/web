// 주소 검색 테스트. 검색 전후 상태, 선택 조건, 고른 주소를 어떻게 넘기는지 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, expect, test, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

import { ADDRESS_PAGE_SIZE } from "../api/address-search";
import { SearchAddressView } from "./search-address-view";

beforeEach(() => push.mockClear());

function renderAt(search = "") {
  render(
    <NuqsTestingAdapter searchParams={search}>
      <SearchAddressView />
    </NuqsTestingAdapter>,
  );
}

const searchFor = (keyword: string) => {
  fireEvent.change(screen.getByLabelText("주소 검색어"), { target: { value: keyword } });
  fireEvent.click(screen.getByRole("button", { name: "검색" }));
};

test("검색 전에는 결과 대신 입력 예시를 보여준다", () => {
  renderAt();

  // 시안(mypa_312_입력전)의 안내. 어떻게 찾는지 알려 준다.
  expect(screen.getByText("예) 연희동 42-18")).toBeDefined();
  expect(screen.queryByText("06133")).toBeNull();
});

test("검색어가 없으면 검색 버튼이 꺼져 있다", () => {
  renderAt();
  expect((screen.getByRole("button", { name: "검색" }) as HTMLButtonElement).disabled).toBe(true);
});

// 행안부 API가 한 글자를 E0008로 거절한다. 보내기 전에 막는지 본다
test("검색어가 한 글자면 검색 버튼이 꺼져 있다", () => {
  renderAt();

  fireEvent.change(screen.getByLabelText("주소 검색어"), { target: { value: "가" } });
  expect((screen.getByRole("button", { name: "검색" }) as HTMLButtonElement).disabled).toBe(true);

  fireEvent.change(screen.getByLabelText("주소 검색어"), { target: { value: "가나" } });
  expect((screen.getByRole("button", { name: "검색" }) as HTMLButtonElement).disabled).toBe(false);
});

test("검색하면 결과를 보여주고 고르면 완료가 켜진다", () => {
  renderAt();

  searchFor("테헤란로");

  const submit = screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement;
  expect(submit.disabled).toBe(true);

  fireEvent.click(screen.getAllByText("06133")[0]);
  expect(submit.disabled).toBe(false);
});

// 이 화면의 존재 이유다. 고른 주소가 배송지 화면까지 가지 않으면 아무것도 한 것이 없다
test("고른 주소를 우편번호와 함께 배송지 화면으로 넘긴다", () => {
  renderAt();

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
  renderAt();

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

// PD팀이 한 페이지 4개로 정했다(2026-09-15). 393×852에서 스크롤이 생기지 않는 수다
test("한 페이지에 주소를 4개까지 보여준다", () => {
  renderAt();

  searchFor("테헤란로");

  expect(screen.getAllByRole("listitem")).toHaveLength(ADDRESS_PAGE_SIZE);
  expect(screen.getByLabelText("검색 결과 페이지")).toBeDefined();
});

test("다음·이전으로 페이지를 넘기고 양 끝에서 막힌다", () => {
  renderAt();

  searchFor("테헤란로");

  const prev = () => screen.getByRole("button", { name: "이전 페이지" }) as HTMLButtonElement;
  const next = () => screen.getByRole("button", { name: "다음 페이지" }) as HTMLButtonElement;

  // 첫 쪽에서는 뒤로 갈 곳이 없다
  expect(prev().disabled).toBe(true);
  expect(screen.getByText("서울특별시 강남구 테헤란로 123 (역삼동)")).toBeDefined();

  fireEvent.click(next());
  expect(prev().disabled).toBe(false);
  expect(screen.queryByText("서울특별시 강남구 테헤란로 123 (역삼동)")).toBeNull();

  fireEvent.click(next());
  // 목이 9건이라 4·4·1로 나뉜다. 마지막 쪽에서는 더 갈 곳이 없다
  expect(next().disabled).toBe(true);
  expect(screen.getAllByRole("listitem")).toHaveLength(1);

  fireEvent.click(prev());
  expect(next().disabled).toBe(false);
});

// 페이지를 넘기면 고른 항목이 화면에서 사라진다. 남겨 두면 보이지 않는 주소로 넘어간다
test("페이지를 넘기면 앞서 고른 것이 풀린다", () => {
  renderAt();

  searchFor("테헤란로");
  fireEvent.click(screen.getByText("서울특별시 강남구 테헤란로 123 (역삼동)"));

  const submit = () => screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement;
  expect(submit().disabled).toBe(false);

  fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));
  expect(submit().disabled).toBe(true);
});

// 고치던 대상을 잃으면 배송지 화면이 새 배송지로 다시 서서 먼저 적어 둔 값이 날아간다
test("고치던 배송지(place)를 그대로 돌려준다", () => {
  renderAt("?place=home");

  searchFor("테헤란로");
  fireEvent.click(screen.getByText("서울특별시 강남구 테헤란로 123 (역삼동)"));
  fireEvent.click(screen.getByRole("button", { name: "입력 완료" }));

  const url = new URL(push.mock.calls[0][0], "http://localhost");
  expect(url.searchParams.get("place")).toBe("home");
  expect(url.searchParams.get("zipNo")).toBe("06133");
});

// 새 배송지를 만드는 중이면 붙일 대상이 없다
test("새 배송지면 place를 붙이지 않는다", () => {
  renderAt();

  searchFor("테헤란로");
  fireEvent.click(screen.getByText("서울특별시 강남구 테헤란로 123 (역삼동)"));
  fireEvent.click(screen.getByRole("button", { name: "입력 완료" }));

  const url = new URL(push.mock.calls[0][0], "http://localhost");
  expect(url.searchParams.has("place")).toBe(false);
});
