// 실패 원인을 문구 코드로 옮기는 규칙을 고정한다.
// 매핑을 다 채우지 않아도 화면이 도는 것, 그리고 서버에 닿지 못한 경우를 구분하는 것이 핵심이다.
import { describe, expect, it } from "vitest";

import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";

import { ApiError } from "./client";
import { toAppMessageCode, MESSAGE_BY_ERROR_CODE } from "./error-message";
import { ImageUploadError } from "./upload-image";

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

  // S3 응답은 ProblemDetail이 아니다. "요청 실패"로 떨어뜨리면 무엇을 다시 해야 하는지 모른다
  it("S3 업로드 실패는 사진을 다시 고르라는 문구로 간다", () => {
    expect(toAppMessageCode(new ImageUploadError(403))).toBe(APP_MESSAGE_CODE.image.uploadFailed);
    expect(toAppMessageCode(apiError(400, "MEMBER_400_INVALID_IMAGE_EXTENSION"))).toBe(
      APP_MESSAGE_CODE.image.unsupportedType,
    );
    expect(toAppMessageCode(apiError(400, "REVIEW_400_INVALID_IMAGE_EXTENSION"))).toBe(
      APP_MESSAGE_CODE.image.unsupportedType,
    );
  });

  it("리뷰 규칙에 걸린 것은 왜인지를 알리는 문구로 간다", () => {
    expect(toAppMessageCode(apiError(409, "REVIEW_409_ALREADY_REVIEWED"))).toBe(
      APP_MESSAGE_CODE.review.alreadyReviewed,
    );
    expect(toAppMessageCode(apiError(403, "REVIEW_403_PURCHASE_NOT_CONFIRMED"))).toBe(
      APP_MESSAGE_CODE.review.purchaseNotConfirmed,
    );
    expect(toAppMessageCode(apiError(409, "REVIEW_409_ALREADY_ANSWERED_FEEDBACK"))).toBe(
      APP_MESSAGE_CODE.review.feedbackAlreadyAnswered,
    );
    expect(toAppMessageCode(apiError(400, "REVIEW_400_FEEDBACK_NOT_AVAILABLE_YET"))).toBe(
      APP_MESSAGE_CODE.review.feedbackNotAvailableYet,
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

/**
 * **매핑에 적힌 코드가 백엔드에 실재하는지 본다.**
 *
 * 죽은 키는 조용히 지나간다 — 매핑이 안 걸려 기본 문구로 떨어질 뿐 오류가 나지 않는다.
 * 그렇게 `AUTH_400`과 `PAYMENT_400_AMOUNT_MISMATCH` 둘이 오래 남아 있었다 (#310).
 *
 * 백엔드 소스를 여기서 읽을 수는 없으니, **대조해 확인한 목록을 적어 두고 그것과 견준다.**
 * 서버가 코드를 바꾸면 이 목록도 함께 고쳐야 하고, 그 순간이 다시 대조할 때다.
 */
describe("서버 에러 코드와의 대조", () => {
  /** 2026-09-22에 백엔드 소스에서 확인한 코드들 (`grep -rhoE '"[A-Z]+_[0-9]{3}_[A-Z_]+"'`) */
  const SERVER_CODES = new Set([
    "AUTH_400_INVALID_LOGIN_CODE",
    "AUTH_400_INVALID_TOKEN",
    "AUTH_403_MEMBER_ID_MISMATCH",
    "AUTH_404_INVALID_AUTH",
    "AUTH_429_TOO_MANY_REQUESTS",
    "COMMON_400",
    "COMMON_405",
    "COMMON_500",
    "MEMBER_400_DUPLICATE_AGREEMENT_TYPE",
    "MEMBER_400_INVALID_ALLERGY",
    "MEMBER_400_INVALID_BREED",
    "MEMBER_400_INVALID_CONCERN",
    "MEMBER_400_INVALID_IMAGE_EXTENSION",
    "MEMBER_400_INVALID_PHONE_CODE",
    "MEMBER_400_LAST_DEFAULT_ADDRESS",
    "MEMBER_400_REQUIRED_AGREEMENT_NOT_AGREED",
    "MEMBER_401_UNAUTHORIZED",
    "MEMBER_403_FORBIDDEN_IMAGE",
    "MEMBER_404_NOT_FOUND",
    "MEMBER_404_NOT_FOUND_ADDRESS",
    "MEMBER_404_NOT_FOUND_PET",
    "MEMBER_404_NOT_FOUND_PRODUCT",
    "MEMBER_409_ALREADY_HAVE_NICKNAME",
    "MEMBER_409_ALREADY_SIGNED_UP",
    "ORDER_400_INVALID_CLAIM_TYPE",
    "ORDER_400_INVALID_CURSOR",
    "ORDER_403_OWNER_MISMATCH",
    "ORDER_404_ADDRESS_NOT_FOUND",
    "ORDER_404_CART_ITEM_NOT_FOUND",
    "ORDER_404_ITEM_NOT_FOUND",
    "ORDER_404_ORDER_NOT_FOUND",
    "ORDER_404_PRODUCT_NOT_FOUND",
    "ORDER_409_CLAIM_ALREADY_IN_PROGRESS",
    "ORDER_409_CLAIM_ITEM_QUANTITY_EXCEEDED",
    "ORDER_409_INSUFFICIENT_STOCK",
    "ORDER_409_NOT_CANCELLABLE",
    "ORDER_409_NOT_CLAIMABLE",
    "ORDER_409_NOT_CONFIRMABLE",
    "ORDER_409_PRODUCT_NOT_PURCHASABLE",
    "ORDER_409_STOCK_MOVEMENT_CONFLICT",
    "ORDER_500_INVENTORY_REQUEST_INVALID",
    "ORDER_500_MEMBER_SERVICE_REQUEST_INVALID",
    "ORDER_503_INVENTORY_SERVICE_UNAVAILABLE",
    "ORDER_503_MEMBER_SERVICE_UNAVAILABLE",
    "ORDER_503_PRODUCT_SERVICE_UNAVAILABLE",
    "PAYMENT_403_ORDER_OWNER_MISMATCH",
    "PAYMENT_404_NOT_FOUND",
    "PAYMENT_404_ORDER_NOT_FOUND",
    "PAYMENT_409_AMOUNT_MISMATCH",
    "PAYMENT_409_NOT_CONFIRMABLE",
    "PAYMENT_409_ORDER_NOT_PAYABLE",
    "PAYMENT_500_TOSS_CANCEL_FAILED",
    "PAYMENT_502_TOSS_CONFIRM_FAILED",
    "PAYMENT_503_ORDER_SERVICE_UNAVAILABLE",
    "PAYMENT_503_TOSS_SERVICE_UNAVAILABLE",
    "PRODUCT_400_INVALID_CURSOR",
    "PRODUCT_400_INVALID_TIME_DEAL_STATUS",
    "PRODUCT_404_PRODUCT_NOT_FOUND",
    "PRODUCT_404_TIME_DEAL_ITEM_NOT_FOUND",
    "PRODUCT_409_INSUFFICIENT_STOCK",
    "PRODUCT_409_STOCK_MOVEMENT_CONFLICT",
    "PRODUCT_409_STOCK_MOVEMENT_PRECONDITION_NOT_MET",
    "REVIEW_400_DUPLICATE_QUESTION_KEY",
    "REVIEW_400_INVALID_ANSWER",
    "REVIEW_400_INVALID_FILTER",
    "REVIEW_400_INVALID_IMAGE_EXTENSION",
    "REVIEW_400_INVALID_PET",
    "REVIEW_400_INVALID_QUESTION_KEY",
    "REVIEW_403_FORBIDDEN_IMAGE",
    "REVIEW_403_PURCHASE_NOT_CONFIRMED",
    "REVIEW_404_NOT_FOUND",
    "REVIEW_409_ALREADY_REVIEWED",
    "REVIEW_409_ALREADY_ANSWERED_FEEDBACK",
    "REVIEW_400_FEEDBACK_NOT_AVAILABLE_YET",
    "NOTIFICATION_404_NOT_FOUND",
    "SECURITY_401_MISSING_AUTH_ID",
    "SECURITY_401_UNAUTHORIZED",
    "SECURITY_403_MISSING_MEMBER_ID",
  ]);

  /** 우리 Route Handler(`/api/juso`)가 붙이는 코드. 백엔드 것이 아니라 대조 대상이 아니다 */
  const OURS = /^JUSO_/;

  it("매핑에 죽은 키가 없다", () => {
    const dead = Object.keys(MESSAGE_BY_ERROR_CODE).filter(
      (code) => !OURS.test(code) && !SERVER_CODES.has(code),
    );
    expect(dead).toEqual([]);
  });
});
