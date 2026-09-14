// 로그에 무엇이 나가고 무엇이 나가지 않는지를 고정한다.
// 시큐어 코딩 가이드 SC-G-02가 막는 것은 민감정보 유출이므로, 응답 본문이 새지 않는 것이 핵심이다.
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api/client";

import { reportError } from "./report-error";

const spyConsole = () => vi.spyOn(console, "error").mockImplementation(() => {});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("reportError", () => {
  it("어디서 났는지와 상태·코드를 남긴다", () => {
    const spy = spyConsole();

    reportError("cart.remove", new ApiError(409, "실패", { errorCode: "PRODUCT_409_X" }));

    expect(spy).toHaveBeenCalledWith("[cart.remove]", "ApiError status=409 code=PRODUCT_409_X");
  });

  // 백엔드 detail에 무엇이 담길지 우리가 통제하지 못한다. 로그에도 올리지 않는다
  it("응답 본문은 남기지 않는다", () => {
    const spy = spyConsole();

    reportError(
      "auth.refresh",
      new ApiError(401, "실패", {
        errorCode: "AUTH_401",
        detail: "token=eyJhbGciOiJIUzI1NiJ9.secret",
      }),
    );

    const logged = spy.mock.calls[0]?.join(" ") ?? "";
    expect(logged).not.toContain("eyJhbGciOiJIUzI1NiJ9");
    expect(logged).not.toContain("token=");
    expect(logged).toContain("status=401");
  });

  it("errorCode가 없으면 없다고 남긴다", () => {
    const spy = spyConsole();

    reportError("unknown", new ApiError(500, "실패"));

    expect(spy).toHaveBeenCalledWith("[unknown]", "ApiError status=500 code=none");
  });

  // message에 무엇이 담길지 우리가 정하지 못한다. 라이브러리가 요청 URL을 넣기도 하고,
  // JSON 파싱 실패는 본문 조각을 그대로 실어 보낸다
  it("일반 Error는 이름만 남기고 message는 버린다", () => {
    const spy = spyConsole();

    reportError("route error", new TypeError("Failed to fetch https://api.test/u?token=abc123"));

    expect(spy).toHaveBeenCalledWith("[route error]", "TypeError");
    expect(spy.mock.calls[0]?.join(" ")).not.toContain("token=abc123");
  });

  it("Error가 아닌 것도 형태만 남기고 넘어간다", () => {
    const spy = spyConsole();

    reportError("weird", { token: "비밀" });

    expect(spy).toHaveBeenCalledWith("[weird]", "Unknown: object");
    expect(spy.mock.calls[0]?.join(" ")).not.toContain("비밀");
  });
});
