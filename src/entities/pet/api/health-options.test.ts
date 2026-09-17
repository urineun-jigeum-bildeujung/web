// 건강 옵션 조회 테스트. 종을 무엇으로 보내는지, 서버 모양을 화면 모양으로 어떻게 옮기는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import { getHealthOptions } from "./health-options";

const RESPONSE = {
  categories: [
    { category: "관절·뼈", items: ["슬개골 탈구", "관절염"] },
    { category: "체중·대사", items: ["과체중·비만"] },
  ],
  allergies: [
    { code: "CHICKEN", displayName: "닭고기" },
    { code: "DAIRY", displayName: "유제품" },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

test("종을 백엔드 enum으로 보낸다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(RESPONSE));
  vi.stubGlobal("fetch", fetchMock);

  await getHealthOptions("cat");

  const [url] = fetchMock.mock.calls[0] as [string];
  expect(url).toContain("/pets/health-options");
  expect(url).toContain("species=CAT");
});

test("대분류를 그대로 묶음으로 옮긴다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(RESPONSE)));

  const { concerns } = await getHealthOptions("dog");

  expect(concerns.map((group) => group.label)).toEqual(["관절·뼈", "체중·대사"]);
  expect(concerns[0]?.items).toEqual([
    { value: "슬개골 탈구", label: "슬개골 탈구" },
    { value: "관절염", label: "관절염" },
  ]);
});

// 표시명이 바뀌어도 저장된 값이 깨지지 않으려면 코드로 저장해야 한다
test("알레르기는 코드를 값으로, 표시명을 이름으로 쓴다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(RESPONSE)));

  const { allergies } = await getHealthOptions("dog");

  expect(allergies[0]?.items).toEqual([
    { value: "CHICKEN", label: "닭고기" },
    { value: "DAIRY", label: "유제품" },
  ]);
});

// 서버가 묶음 없이 평평하게 준다. 시트는 묶음 단위로 그린다
test("알레르기는 한 묶음으로 싼다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(RESPONSE)));

  const { allergies } = await getHealthOptions("dog");

  expect(allergies).toHaveLength(1);
});
