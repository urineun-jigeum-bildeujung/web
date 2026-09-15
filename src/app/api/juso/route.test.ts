// 주소 검색 통로 단위 테스트. 승인키를 지키는지와, 행안부가 뜻밖의 답을 줘도 버티는지 본다.
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { GET } from "./route";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("JUSO_CONFM_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const call = (search = "?keyword=테헤란로&currentPage=1&countPerPage=4") =>
  GET(new Request(`http://localhost:3000/api/juso${search}`));

const upstream = (body: unknown, ok = true) => ({ ok, json: async () => body });

const success = {
  results: {
    common: { errorCode: "0", errorMessage: "정상", totalCount: "1", currentPage: "1" },
    juso: [
      {
        zipNo: "06133",
        roadAddr: "서울특별시 강남구 테헤란로 123 (역삼동)",
        jibunAddr: "서울특별시 강남구 역삼동 648-23 여삼빌딩",
        bdNm: "여삼빌딩",
        // 화면이 쓰지 않는 나머지 필드. 걸러지는지 보려고 하나 섞는다
        admCd: "1168010100",
      },
    ],
  },
};

test("승인키를 요청에 넣고 응답에는 넣지 않는다", async () => {
  fetchMock.mockResolvedValue(upstream(success));

  const response = await call();
  const body = await response.json();

  expect(String(fetchMock.mock.calls[0][0])).toContain("confmKey=test-key");
  expect(JSON.stringify(body)).not.toContain("test-key");
});

test("화면이 쓰는 네 필드만 추려 보낸다", async () => {
  fetchMock.mockResolvedValue(upstream(success));

  const body = await (await call()).json();

  expect(Object.keys(body.items[0]).sort()).toEqual(["bdNm", "jibunAddr", "roadAddr", "zipNo"]);
  expect(body.totalCount).toBe(1);
  expect(body.currentPage).toBe(1);
});

test("건물명이 빈 문자열이면 없는 값으로 보낸다", async () => {
  fetchMock.mockResolvedValue(
    upstream({
      results: { ...success.results, juso: [{ ...success.results.juso[0], bdNm: "" }] },
    }),
  );

  const body = await (await call()).json();

  expect(body.items[0].bdNm).toBeUndefined();
});

test("승인키가 없으면 부르지 않고 500을 준다", async () => {
  vi.stubEnv("JUSO_CONFM_KEY", "");

  const response = await call();

  expect(response.status).toBe(500);
  expect((await response.json()).errorCode).toBe("JUSO_500_INVALID_KEY");
  expect(fetchMock).not.toHaveBeenCalled();
});

// 행안부는 실패도 HTTP 200으로 준다. res.ok로는 못 거른다
test.each([
  ["E0001", 500, "JUSO_500_INVALID_KEY"],
  ["E0006", 400, "JUSO_400_KEYWORD_TOO_BROAD"],
  ["E0008", 400, "JUSO_400_KEYWORD_TOO_SHORT"],
  ["E0009", 400, "JUSO_400_KEYWORD_INVALID"],
  ["E9999", 502, "JUSO_502_UPSTREAM"],
])("행안부 %s를 %s %s로 옮긴다", async (errorCode, status, mapped) => {
  fetchMock.mockResolvedValue(
    upstream({
      results: {
        common: { errorCode, errorMessage: "무슨 오류", totalCount: "0", currentPage: "1" },
        juso: null,
      },
    }),
  );

  const response = await call();

  expect(response.status).toBe(status);
  expect((await response.json()).errorCode).toBe(mapped);
});

// 점검 안내 페이지나 프록시가 끼어든 HTML이 200으로 올 수 있다.
// 막지 않으면 핸들러가 그대로 터져 500이 나간다
test.each([
  ["JSON이 아님", null, true],
  ["results가 없음", { hello: "world" }, true],
  ["common이 없음", { results: { juso: [] } }, true],
  [
    "totalCount가 숫자가 아님",
    {
      results: {
        common: { errorCode: "0", errorMessage: "정상", totalCount: "많음", currentPage: "1" },
        juso: [],
      },
    },
    true,
  ],
])("뜻밖의 응답(%s)을 502로 옮긴다", async (_label, body, ok) => {
  fetchMock.mockResolvedValue(
    body === null
      ? {
          ok,
          json: async () => {
            throw new Error("not json");
          },
        }
      : upstream(body, ok),
  );

  const response = await call();

  expect(response.status).toBe(502);
  expect((await response.json()).errorCode).toBe("JUSO_502_UPSTREAM");
});

test("행안부에 닿지 못하면 502를 준다", async () => {
  fetchMock.mockRejectedValue(new Error("connect ETIMEDOUT"));

  const response = await call();

  expect(response.status).toBe(502);
  // 실패 원인을 그대로 담으면 요청 URL에 든 승인키가 새어 나갈 수 있다
  expect(JSON.stringify(await response.json())).not.toContain("ETIMEDOUT");
});

test("행안부가 2xx가 아니면 502를 준다", async () => {
  fetchMock.mockResolvedValue(upstream({}, false));

  const response = await call();

  expect(response.status).toBe(502);
});

test("기다리는 시간에 한계를 둔다", async () => {
  fetchMock.mockResolvedValue(upstream(success));

  await call();

  expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
});
