// 토큰 보관소 단위 테스트. 저장·조회·삭제와 보관 위치 분리를 검증한다.
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasSession,
  saveTokens,
  subscribeTokensCleared,
} from "./token-store";

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

  it("hasSession은 refreshToken만 남아 있어도 참이다", () => {
    expect(hasSession()).toBe(false);

    saveTokens({ accessToken: "access-1", refreshToken: "refresh-1" });
    expect(hasSession()).toBe(true);

    // 새로고침 직후를 흉내 낸다. accessToken은 메모리라 사라지고 refreshToken만 남는다.
    window.localStorage.setItem("gollaju.refreshToken", "refresh-1");
    clearTokens();
    window.localStorage.setItem("gollaju.refreshToken", "refresh-1");
    expect(getAccessToken()).toBeNull();
    expect(hasSession()).toBe(true);
  });

  it("세션이 있던 상태에서 지우면 리스너를 부르고, 이미 비어 있으면 부르지 않는다", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTokensCleared(listener);

    clearTokens();
    expect(listener).not.toHaveBeenCalled();

    saveTokens({ accessToken: "access-1", refreshToken: "refresh-1" });
    clearTokens();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    saveTokens({ accessToken: "access-2", refreshToken: "refresh-2" });
    clearTokens();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
