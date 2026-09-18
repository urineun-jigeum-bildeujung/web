// 주소 검색 테스트. 검색 조건, 쪽 넘기기, 고른 주소를 어떻게 넘기는지 검증한다.
//
// 조회는 가짜로 둔다. 무엇을 보내고 돌아온 것을 어떻게 다루는지는 `api/address-search.test.ts`가 본다.
//
// 뒤로가기로 주소창이 바뀌는 경우는 여기서 확인하지 못한다.
// NuqsTestingAdapter는 `hasMemory`로 우리가 쓴 값만 기억할 뿐, 밖에서 주소창을 바꾸는 것은 흉내내지 못한다.
// 그 경우는 화면 쪽에서 렌더 중에 앞 값과 견주어 입력칸을 맞춘다.
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, expect, test, vi } from "vitest";

import { ApiError } from "@/shared/api/client";
import type { AddressResult } from "@/shared/ui/address-result-list/address-result-list";

const push = vi.fn();
const useQueryAddressSearch = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));
// 조회 훅을 가짜로 둔다. 무엇을 보내고 돌아온 것을 어떻게 다루는지는 `api/address-search.test.ts`가 본다
vi.mock("../api/use-query-address-search", () => ({
  useQueryAddressSearch: (...args: unknown[]) => useQueryAddressSearch(...args),
}));

import { ADDRESS_PAGE_SIZE } from "../api/address-search";
import { SearchAddressView } from "./search-address-view";

/** 실제 행안부 응답을 옮긴 값 */
const ITEMS: AddressResult[] = [
  {
    zipNo: "06133",
    roadAddr: "서울특별시 강남구 테헤란로 123 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 648-23 여삼빌딩",
    bdNm: "여삼빌딩",
  },
  {
    zipNo: "06134",
    roadAddr: "서울특별시 강남구 테헤란로 101 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 821 이즈타워",
    bdNm: "이즈타워",
  },
  {
    zipNo: "06134",
    roadAddr: "서울특별시 강남구 테헤란로 103 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 822 인춘재단빌딩",
  },
  {
    zipNo: "06134",
    roadAddr: "서울특별시 강남구 테헤란로 105 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 822-1",
  },
  // 9건이면 4·4·1로 나뉜다. 쪽마다 다른 결과가 나와야 "쪽을 넘기면 선택이 풀린다"를 겨눌 수 있다
  ...Array.from({ length: 5 }, (_, index) => ({
    zipNo: "06232",
    roadAddr: `서울특별시 강남구 테헤란로 ${200 + index} (역삼동)`,
    jibunAddr: `서울특별시 강남구 역삼동 900-${index}`,
  })),
];

beforeEach(() => {
  push.mockClear();
  // 9건을 4개씩 나누면 4·4·1이라 마지막 쪽이 덜 차는 경우까지 덮는다
  useQueryAddressSearch.mockReset();
  useQueryAddressSearch.mockImplementation((keyword: string, page: number) => ({
    result: keyword
      ? {
          items: ITEMS.slice((page - 1) * ADDRESS_PAGE_SIZE, page * ADDRESS_PAGE_SIZE),
          totalCount: ITEMS.length,
          page,
        }
      : undefined,
    error: null,
    isSearching: false,
    isRefreshing: false,
  }));
});

function renderAt(search = "") {
  render(
    // hasMemory가 없으면 searchParams가 초기값에 얼어붙어 setQuery가 반영되지 않는다.
    // 그러면 검색을 눌러도 결과가 영영 오지 않는다
    <NuqsTestingAdapter searchParams={search} hasMemory>
      <SearchAddressView />
    </NuqsTestingAdapter>,
  );
}

const searchFor = (keyword: string) => {
  fireEvent.change(screen.getByLabelText("주소 검색어"), { target: { value: keyword } });
  fireEvent.click(screen.getByRole("button", { name: "검색" }));
};

const firstResult = () => screen.getByText(ITEMS[0].roadAddr);

test("검색 전에는 결과 대신 입력 예시를 보여준다", () => {
  renderAt();

  expect(screen.getByText("예) 연희동 42-18")).toBeDefined();
  expect(screen.queryByText("06133")).toBeNull();
  expect(useQueryAddressSearch).toHaveBeenCalledWith("", 1);
});

test("검색어가 없으면 검색 버튼이 꺼져 있다", () => {
  renderAt();
  expect((screen.getByRole("button", { name: "검색" }) as HTMLButtonElement).disabled).toBe(true);
});

// 행안부가 한 글자를 E0008로 거절한다. 보내기 전에 막는지 본다
test("검색어가 한 글자면 검색 버튼이 꺼져 있다", () => {
  renderAt();

  fireEvent.change(screen.getByLabelText("주소 검색어"), { target: { value: "가" } });
  expect((screen.getByRole("button", { name: "검색" }) as HTMLButtonElement).disabled).toBe(true);

  fireEvent.change(screen.getByLabelText("주소 검색어"), { target: { value: "가나" } });
  expect((screen.getByRole("button", { name: "검색" }) as HTMLButtonElement).disabled).toBe(false);
});

test("찾는 동안 뼈대를 보여준다", () => {
  useQueryAddressSearch.mockReturnValue({
    result: undefined,
    error: null,
    isSearching: true,
    isRefreshing: false,
  });
  renderAt("?query=테헤란로");

  // 화면을 보지 않는 사람에게도 찾는 중이라고 말로 닿아야 한다
  expect(screen.getByRole("status").textContent).toContain("주소를 찾는 중");
  // 뼈대도 목록으로 그리므로 결과 글자가 없는지로 본다
  expect(screen.queryByText(ITEMS[0].roadAddr)).toBeNull();
});

test("검색하면 결과를 보여주고 고르면 완료가 켜진다", async () => {
  renderAt();

  searchFor("테헤란로");

  const submit = screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement;
  expect(submit.disabled).toBe(true);

  fireEvent.click(firstResult());
  expect(submit.disabled).toBe(false);
});

// PD팀이 한 페이지 4개로 정했다(2026-09-15). 393×852에서 스크롤이 생기지 않는 수다
test("한 페이지에 주소를 4개까지 보여준다", async () => {
  renderAt();

  searchFor("테헤란로");
  firstResult();

  expect(screen.getAllByRole("listitem")).toHaveLength(ADDRESS_PAGE_SIZE);
  expect(screen.getByLabelText("검색 결과 페이지")).toBeDefined();
});

test("다음·이전으로 쪽을 넘기고 양 끝에서 막힌다", async () => {
  renderAt();

  searchFor("테헤란로");
  firstResult();

  const prev = () => screen.getByRole("button", { name: "이전 페이지" }) as HTMLButtonElement;
  const next = () => screen.getByRole("button", { name: "다음 페이지" }) as HTMLButtonElement;

  expect(prev().disabled).toBe(true);

  fireEvent.click(next());
  await waitFor(() => expect(prev().disabled).toBe(false));

  fireEvent.click(next());
  // 9건을 4개씩 나누면 3쪽이다. 마지막 쪽에서는 더 갈 곳이 없다
  await waitFor(() => expect(next().disabled).toBe(true));
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
});

// 이 화면의 존재 이유다. 고른 주소가 배송지 화면까지 가지 않으면 아무것도 한 것이 없다
test("고른 주소를 우편번호와 함께 배송지 화면으로 넘긴다", async () => {
  renderAt();

  searchFor("테헤란로");
  fireEvent.click(firstResult());
  fireEvent.click(screen.getByRole("button", { name: "입력 완료" }));

  expect(push).toHaveBeenCalledTimes(1);
  const url = new URL(push.mock.calls[0][0], "http://localhost");

  expect(url.pathname).toBe("/mypage/address/new");
  expect(url.searchParams.get("zipNo")).toBe("06133");
  expect(url.searchParams.get("roadAddr")).toBe(ITEMS[0].roadAddr);
});

// 고치던 대상을 잃으면 배송지 화면이 새 배송지로 다시 서서 먼저 적어 둔 값이 날아간다
test("고치던 배송지(place)를 그대로 돌려준다", async () => {
  renderAt("?place=home");

  searchFor("테헤란로");
  fireEvent.click(firstResult());
  fireEvent.click(screen.getByRole("button", { name: "입력 완료" }));

  const url = new URL(push.mock.calls[0][0], "http://localhost");
  expect(url.searchParams.get("place")).toBe("home");
});

test("새 배송지면 place를 붙이지 않는다", async () => {
  renderAt();

  searchFor("테헤란로");
  fireEvent.click(firstResult());
  fireEvent.click(screen.getByRole("button", { name: "입력 완료" }));

  const url = new URL(push.mock.calls[0][0], "http://localhost");
  expect(url.searchParams.has("place")).toBe(false);
});

// 쪽을 넘기면 고른 것이 화면에서 사라진다. 남겨 두면 보이지 않는 주소로 넘어간다
test("쪽을 넘기면 앞서 고른 것이 풀린다", async () => {
  renderAt();

  searchFor("테헤란로");
  fireEvent.click(firstResult());

  const submit = () => screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement;
  expect(submit().disabled).toBe(false);

  fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));
  await waitFor(() => expect(submit().disabled).toBe(true));
});

// 찾은 말과 쪽이 주소창에 남아야 새로고침·뒤로가기에서 살아남는다 (AGENTS.md 5.1)
test("주소창의 검색어와 쪽으로 화면을 복원한다", () => {
  renderAt("?query=테헤란로&page=2");

  expect((screen.getByLabelText("주소 검색어") as HTMLInputElement).value).toBe("테헤란로");

  expect(useQueryAddressSearch).toHaveBeenCalledWith("테헤란로", 2);
  expect(screen.getByLabelText("검색 결과 페이지").textContent).toContain("2 / 3");
  // 2쪽 결과가 그려진다. 1쪽 것이 남아 있으면 안 된다
  expect(screen.getByText(ITEMS[ADDRESS_PAGE_SIZE].roadAddr)).toBeDefined();
  expect(screen.queryByText(ITEMS[0].roadAddr)).toBeNull();
});

test("검색어가 없으면 결과 대신 예시를 보여준다", () => {
  renderAt("?page=2");

  expect(screen.getByText("예) 연희동 42-18")).toBeDefined();
  expect(screen.queryByLabelText("검색 결과 페이지")).toBeNull();
});

test("맞는 주소가 없으면 비었다고 알린다", () => {
  useQueryAddressSearch.mockReturnValue({
    result: { items: [], totalCount: 0, page: 1 },
    error: null,
    isSearching: false,
    isRefreshing: false,
  });
  renderAt("?query=없는주소");

  expect(screen.getByText("검색 결과가 없어요")).toBeDefined();
  expect(screen.queryByLabelText("검색 결과 페이지")).toBeNull();
});

// 검색어가 문제면 무엇을 고쳐야 하는지 알려 줘야 다시 찾을 수 있다
test("검색어가 너무 넓으면 그렇게 알려 준다", () => {
  useQueryAddressSearch.mockReturnValue({
    result: undefined,
    error: new ApiError(400, "too broad", { errorCode: "JUSO_400_KEYWORD_TOO_BROAD" }),
    isSearching: false,
    isRefreshing: false,
  });
  renderAt("?query=서울시");

  // 오류도 스크린 리더에 바로 닿아야 한다
  expect(screen.getByRole("alert").textContent).toContain("검색어가 너무 넓어요");
});

test("숫자만 넣으면 그렇게 알려 준다", () => {
  useQueryAddressSearch.mockReturnValue({
    result: undefined,
    error: new ApiError(400, "invalid", { errorCode: "JUSO_400_KEYWORD_INVALID" }),
    isSearching: false,
    isRefreshing: false,
  });
  renderAt("?query=123");

  expect(screen.getByText("검색어를 다시 확인해 주세요")).toBeDefined();
});

// 쪽을 넘길 때 목록을 지우고 뼈대를 띄우면 넘길 때마다 화면이 들썩인다.
// 앞 결과를 그대로 두되 아직 오는 중임을 흐리게 보여 준다
test("새 쪽을 기다리는 동안 앞 결과를 지우지 않는다", () => {
  useQueryAddressSearch.mockReturnValue({
    result: { items: ITEMS.slice(0, ADDRESS_PAGE_SIZE), totalCount: 9, page: 1 },
    error: null,
    isSearching: false,
    isRefreshing: true,
  });
  renderAt("?query=테헤란로&page=2");

  // 뼈대가 아니라 앞 결과가 그대로 있다
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByText(ITEMS[0].roadAddr)).toBeDefined();
  expect(screen.getByRole("list").getAttribute("aria-busy")).toBe("true");
});

// 셰브론이 스피너로 바뀌면 누를 것처럼 보이지 않는다. 실제로도 못 누르게 맞춘다 (#236 리뷰).
// 쪽마다 행안부에 한 번씩 나가므로 버려질 요청을 줄이는 뜻도 있다
test("새 쪽을 기다리는 동안에는 쪽 버튼을 누를 수 없다", () => {
  useQueryAddressSearch.mockReturnValue({
    result: { items: ITEMS.slice(0, ADDRESS_PAGE_SIZE), totalCount: ITEMS.length, page: 1 },
    error: null,
    isSearching: false,
    isRefreshing: true,
  });
  renderAt("?query=테헤란로&page=2");

  const next = screen.getByRole("button", { name: "다음 페이지" }) as HTMLButtonElement;
  expect(next.disabled).toBe(true);
});

// 쪽을 넘기는 동안 `keepPreviousData`가 **앞 쪽 결과**를 내준다. 보정 effect가 그 쪽 번호를
// 근거로 읽으면 방금 누른 이동을 도로 되돌려, 한 번 눌러서는 넘어가지 않는다 (#235).
//
// 위의 "다음·이전으로 쪽을 넘기고"가 이걸 못 잡은 이유는 가짜가 늘 **요청한 쪽을 그대로**
// 돌려줘서 앞 쪽이 남아 있는 상황 자체가 만들어지지 않았기 때문이다.
test("새 쪽을 기다리는 동안 앞 쪽 번호로 되돌리지 않는다", async () => {
  // 1쪽만 받아 둔 상태. 어느 쪽을 물어도 1쪽 것을 placeholder로 내주고 아직 오는 중이라고 답한다
  useQueryAddressSearch.mockImplementation((keyword: string, page: number) => ({
    result: keyword
      ? { items: ITEMS.slice(0, ADDRESS_PAGE_SIZE), totalCount: ITEMS.length, page: 1 }
      : undefined,
    error: null,
    isSearching: false,
    isRefreshing: page !== 1,
  }));

  renderAt("?query=역삼동");
  await waitFor(() => expect(firstResult()).toBeDefined());

  fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));

  // **누른 직후에 단언하면 고치기 전에도 통과한다.** 되돌리는 것은 effect라 한 박자 뒤에 일어난다
  await act(async () => {
    await Promise.resolve();
  });

  const asked = useQueryAddressSearch.mock.calls.at(-1);
  expect(asked).toEqual(["역삼동", 2]);
});
