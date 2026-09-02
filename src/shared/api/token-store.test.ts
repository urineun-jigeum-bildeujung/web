// 토큰 보관소 단위 테스트. 저장·조회·삭제와 보관 위치 분리를 검증한다.
import { afterEach, describe, expect, it } from "vitest";

import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "./token-store";

describe("token-store", () => {
  afterEach(() => {
    clearTokens();
  });

  it("저장한 토큰 쌍을 각각 돌려준다", () => {
    saveTokens({ accessToken: "access-1", refreshToken: "refresh-1" });

    expect(getAccessToken()).toBe("access-1");
    expect(getRefreshToken()).toBe("refresh-1");
  });

  it("accessToken은 localStorage에 남기지 않는다", () => {
    saveTokens({ accessToken: "access-1", refreshToken: "refresh-1" });

    const stored = Object.keys(window.localStorage).map((key) => window.localStorage.getItem(key));
    expect(stored).not.toContain("access-1");
  });

  it("지우면 둘 다 사라진다", () => {
    saveTokens({ accessToken: "access-1", refreshToken: "refresh-1" });

    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
