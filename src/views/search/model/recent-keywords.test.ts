// 최근 검색어가 다섯 개를 넘지 않는지, 저장한 것이 다시 읽히는지, 깨진 값에 무너지지 않는지 본다.
import { beforeEach, describe, expect, it } from "vitest";

import {
  INITIAL_RECENT,
  MAX_RECENT,
  getRecent,
  pushRecent,
  resetRecentCache,
  setRecent,
} from "./recent-keywords";

beforeEach(() => {
  window.localStorage.clear();
  resetRecentCache();
});

describe("pushRecent", () => {
  it("검색한 말이 맨 앞으로 온다", () => {
    expect(pushRecent(["가", "나"], "다")[0]).toBe("다");
  });

  it("같은 말을 두 번 남기지 않는다", () => {
    expect(pushRecent(["가", "나", "다"], "다")).toEqual(["다", "가", "나"]);
  });

  // IA가 최대 5개로 못 박고 있다. 상한이 없으면 화면 절반이 최근 검색어가 된다
  it("다섯 개를 넘기지 않는다", () => {
    const full = ["1", "2", "3", "4", "5"];
    expect(pushRecent(full, "6")).toEqual(["6", "1", "2", "3", "4"]);
    expect(pushRecent(full, "6")).toHaveLength(MAX_RECENT);
  });
});

describe("저장", () => {
  it("저장한 것이 다시 읽힌다", () => {
    setRecent(["관절 영양제"]);
    resetRecentCache();

    expect(getRecent()).toEqual(["관절 영양제"]);
  });

  it("저장된 것이 없으면 시안 값을 보인다", () => {
    expect(getRecent()).toEqual(INITIAL_RECENT);
  });

  it("저장된 값이 깨졌으면 시안 값으로 돌아간다", () => {
    window.localStorage.setItem("recent-keywords", "{{");

    expect(getRecent()).toEqual(INITIAL_RECENT);
  });

  it("문자열이 아닌 것이 섞여 있으면 걸러 낸다", () => {
    window.localStorage.setItem("recent-keywords", JSON.stringify(["사료", 3, null]));

    expect(getRecent()).toEqual(["사료"]);
  });

  it("저장할 때도 다섯 개로 자른다", () => {
    setRecent(["1", "2", "3", "4", "5", "6"]);
    resetRecentCache();

    expect(getRecent()).toHaveLength(MAX_RECENT);
  });
});
