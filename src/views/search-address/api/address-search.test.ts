// 주소 조회 단위 테스트. Route Handler에 무엇을 보내고, 돌아온 것을 어떻게 다루는지 본다.
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { ApiError } from "@/shared/api/client";

import { ADDRESS_PAGE_SIZE, searchAddresses } from "./address-search";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

const item = (zipNo: string) => ({
  zipNo,
  roadAddr: `서울특별시 강남구 테헤란로 ${zipNo}`,
  jibunAddr: `서울특별시 강남구 역삼동 ${zipNo}`,
  bdNm: undefined,
});

const ok = (body: unknown) => ({ ok: true, json: async () => body });

test("Route Handler에 검색어와 쪽, 한 쪽 개수를 넘긴다", async () => {
  fetchMock.mockResolvedValue(ok({ items: [], totalCount: 0, currentPage: 1 }));

  await searchAddresses("테헤란로", 2);

  const url = new URL(fetchMock.mock.calls[0][0], "http://localhost");
  expect(url.pathname).toBe("/api/juso");
  expect(url.searchParams.get("keyword")).toBe("테헤란로");
  expect(url.searchParams.get("currentPage")).toBe("2");
  expect(url.searchParams.get("countPerPage")).toBe(String(ADDRESS_PAGE_SIZE));
});

test("결과를 그대로 돌려준다", async () => {
  fetchMock.mockResolvedValue(
    ok({ items: [item("06133"), item("06134")], totalCount: 2, currentPage: 1 }),
  );

  const result = await searchAddresses("테헤란로", 1);

  expect(result.items).toHaveLength(2);
  expect(result.totalCount).toBe(2);
  expect(result.page).toBe(1);
});

// 행안부는 0·음수·숫자가 아닌 쪽을 1로 보정해 주므로 우리가 손댈 것이 없다
test("찾은 것이 없으면 한 번만 부른다", async () => {
  fetchMock.mockResolvedValue(ok({ items: [], totalCount: 0, currentPage: 1 }));

  const result = await searchAddresses("없는주소", 1);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(result.totalCount).toBe(0);
});

// 행안부가 마지막 쪽을 넘는 값은 보정하지 않는다 — totalCount는 주면서 결과만 0건으로 온다
test("마지막 쪽을 넘는 쪽을 요청하면 마지막 쪽을 다시 받아온다", async () => {
  fetchMock
    .mockResolvedValueOnce(ok({ items: [], totalCount: 9, currentPage: 999 }))
    .mockResolvedValueOnce(ok({ items: [item("06133")], totalCount: 9, currentPage: 3 }));

  const result = await searchAddresses("테헤란로", 999);

  expect(fetchMock).toHaveBeenCalledTimes(2);
  // 9건을 4개씩 나누면 3쪽이다
  const second = new URL(fetchMock.mock.calls[1][0], "http://localhost");
  expect(second.searchParams.get("currentPage")).toBe("3");
  expect(result.page).toBe(3);
  expect(result.items).toHaveLength(1);
});

// Route Handler가 실패를 ProblemDetail로 옮겨 준다. 그 errorCode가 살아 있어야 문구를 고를 수 있다
test("실패하면 errorCode를 담은 ApiError를 던진다", async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    status: 400,
    json: async () => ({
      status: 400,
      errorCode: "JUSO_400_KEYWORD_TOO_BROAD",
      detail: "주소를 상세히 입력해 주시기 바랍니다.",
    }),
  });

  await expect(searchAddresses("서울", 1)).rejects.toMatchObject({
    status: 400,
    problem: { errorCode: "JUSO_400_KEYWORD_TOO_BROAD" },
  });
});

test("응답 본문이 JSON이 아니어도 ApiError로 던진다", async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    status: 502,
    json: async () => {
      throw new Error("not json");
    },
  });

  await expect(searchAddresses("테헤란로", 1)).rejects.toBeInstanceOf(ApiError);
});
