// 실패 원인을 문구 코드로 옮기는 규칙을 고정한다.
// 매핑을 다 채우지 않아도 화면이 도는 것, 그리고 서버에 닿지 못한 경우를 구분하는 것이 핵심이다.
import { describe, expect, it } from "vitest";

import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";

import { ApiError } from "./client";
import { toAppMessageCode } from "./error-message";

const apiError = (status: number, errorCode?: string) =>
  new ApiError(status, "실패", errorCode ? { status, errorCode } : { status });

describe("toAppMessageCode", () => {
  it("아는 errorCode는 그 상황에 맞는 문구로 간다", () => {
    expect(toAppMessageCode(apiError(409, "PRODUCT_409_INSUFFICIENT_STOCK"))).toBe(
      APP_MESSAGE_CODE.product.outOfStock,
    );
    expect(toAppMessageCode(apiError(409, "MEMBER_409_ALREADY_HAVE_NICKNAME"))).toBe(
      APP_MESSAGE_CODE.member.nicknameTaken,
    );
  });

  // 백엔드가 새 코드를 추가하면 우리는 나중에 안다. 그동안에도 화면은 무언가를 보여줘야 한다
  it("모르는 errorCode는 상태 코드 기준 문구로 떨어진다", () => {
    expect(toAppMessageCode(apiError(404, "ORDER_404_NOT_EXIST"))).toBe(
      APP_MESSAGE_CODE.common.notFound,
    );
    expect(toAppMessageCode(apiError(503, "PAYMENT_503_UPSTREAM"))).toBe(
      APP_MESSAGE_CODE.common.serverError,
    );
  });

  it("errorCode가 아예 없어도 상태 코드로 고른다", () => {
    expect(toAppMessageCode(apiError(401))).toBe(APP_MESSAGE_CODE.common.unauthorized);
    expect(toAppMessageCode(apiError(403))).toBe(APP_MESSAGE_CODE.common.forbidden);
    expect(toAppMessageCode(apiError(500))).toBe(APP_MESSAGE_CODE.common.serverError);
  });

  // 서버에 닿지도 못한 것이라 사용자가 할 수 있는 일이 다르다. 네트워크를 확인하라고 알린다
  it("fetch 자체가 실패한 경우는 연결 실패로 구분한다", () => {
    expect(toAppMessageCode(new TypeError("Failed to fetch"))).toBe(
      APP_MESSAGE_CODE.common.networkError,
    );
  });

  it("정체를 알 수 없는 것은 기본 문구로 간다", () => {
    expect(toAppMessageCode(new Error("어디선가 터짐"))).toBe(
      APP_MESSAGE_CODE.common.requestFailed,
    );
    expect(toAppMessageCode("문자열")).toBe(APP_MESSAGE_CODE.common.requestFailed);
  });

  // 고른 코드로 문구를 찾지 못하면 토스트가 undefined를 띄운다
  it("고른 코드는 모두 실재하는 문구를 가리킨다", () => {
    const cases = [
      apiError(409, "PRODUCT_409_INSUFFICIENT_STOCK"),
      apiError(404, "모르는코드"),
      apiError(401),
      new TypeError("Failed to fetch"),
      new Error("기타"),
    ];

    for (const cause of cases) {
      expect(APP_MESSAGE[toAppMessageCode(cause)]).toBeDefined();
    }
  });
});
