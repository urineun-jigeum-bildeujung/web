// 주소 검색 테스트. 검색 전후 상태, 선택 조건, 쪽 넘기기, 고른 주소를 어떻게 넘기는지 검증한다.
//
// 뒤로가기로 주소창이 바뀌는 경우는 여기서 확인하지 못한다.
// NuqsTestingAdapter의 searchParams는 처음 한 번만 읽혀, 다시 렌더해도 값이 바뀌지 않는다.
// 그 경우는 화면 쪽에서 렌더 중에 앞 값과 견주어 입력칸을 맞춘다.
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

// 찾은 말과 쪽이 주소창에 남아야 새로고침·뒤로가기에서 살아남는다 (AGENTS.md 5.1)
test("주소창의 검색어와 쪽으로 화면을 복원한다", () => {
  renderAt("?query=테헤란로&page=2");

  // 입력칸에 찾은 말이 되돌아오고, 2쪽 결과가 그려진다
  expect((screen.getByLabelText("주소 검색어") as HTMLInputElement).value).toBe("테헤란로");
  // 쪽 표시는 숫자와 "/ 전체"가 다른 요소라 getByText로는 잡히지 않는다
  expect(screen.getByLabelText("검색 결과 페이지").textContent).toContain("2 / 3");
  expect(screen.getAllByRole("listitem")).toHaveLength(ADDRESS_PAGE_SIZE);
});

test("검색어가 없으면 결과 대신 예시를 보여준다", () => {
  renderAt("?page=2");

  expect(screen.getByText("예) 연희동 42-18")).toBeDefined();
  expect(screen.queryByLabelText("검색 결과 페이지")).toBeNull();
});

// 목이 검색어를 거르므로 맞는 것이 없으면 빈 화면에 닿는다
test("맞는 주소가 없으면 비었다고 알린다", () => {
  renderAt();

  searchFor("도산대로");

  expect(screen.getByText("검색 결과가 없어요")).toBeDefined();
  expect(screen.queryByLabelText("검색 결과 페이지")).toBeNull();
});

// 주소창에는 아무 값이나 들어올 수 있다. 보정하지 않으면 결과가 있는데도 빈 화면이 나온다
test.each([
  ["0쪽", "?query=테헤란로&page=0"],
  ["음수", "?query=테헤란로&page=-3"],
  ["범위 밖", "?query=테헤란로&page=999"],
  ["소수점", "?query=테헤란로&page=0.5"],
  ["숫자가 아님", "?query=테헤란로&page=abc"],
])("쪽이 %s이면 있는 쪽으로 보정한다", (_label, search) => {
  renderAt(search);

  expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  const shown = screen.getByLabelText("검색 결과 페이지").textContent ?? "";
  expect(shown).toMatch(/[13] \/ 3/);
});
