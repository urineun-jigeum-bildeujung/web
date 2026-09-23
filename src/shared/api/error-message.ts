// 백엔드 실패 응답을 사용자에게 보일 문구 코드로 옮긴다.
//
// 백엔드는 모든 실패 응답에 `errorCode`를 넣는다. 명시적으로 정의하지 않은 예외도
// `GlobalExceptionHandler`가 `COMMON_{상태코드}`를 자동으로 붙이므로 빈 경우는 없다.
// 그래도 우리가 모르는 코드는 계속 생기므로(백엔드가 새 코드를 추가하면 우리는 나중에 안다)
// 상태 코드 기준 기본값으로 떨어뜨린다.
//
// `title`을 키로 쓰지 않는 이유가 있다. AppException 경로에서는 errorCode와 값이 같지만
// Spring이 직접 만드는 응답에서는 보장되지 않는다. 같은 값을 주면서 항상 있는 `errorCode`를 쓴다.

import { APP_MESSAGE_CODE, type AppMessageCode } from "@/shared/config/app-message";

import { ApiError } from "./client";
import { ImageUploadError } from "./upload-image";

/**
 * 백엔드 errorCode에 우리 문구를 붙인다.
 * 여기 없는 코드는 상태 코드 기준 기본 문구로 간다 — 매핑을 다 채우지 않아도 화면은 돈다.
 *
 * 내부 통신용 코드(`MISSING_AUTH_ID`·`INVALID_INTERNAL_SECRET`·`PRODUCT_409_STOCK_MOVEMENT_*`)와
 * 프론트 구현 실수에 가까운 코드(`PRODUCT_400_INVALID_CURSOR`)는 넣지 않았다.
 * 사용자가 볼 일이 없고, 보이더라도 기본 문구가 더 알맞다.
 */
// **테스트가 읽는다.** 서버에 없는 죽은 키가 섞이지 않았는지 대조한다 (#310)
export const MESSAGE_BY_ERROR_CODE: Record<string, AppMessageCode> = {
  COMMON_400: APP_MESSAGE_CODE.common.invalidInput,
  COMMON_500: APP_MESSAGE_CODE.common.serverError,

  // 소셜 복귀 화면이 `code`를 토큰으로 바꾸다 막힌 경우다. 60초가 지났거나 이미 쓴 코드다.
  // **`AUTH_400`이 아니다** — 그 키는 백엔드 어디에도 없어 매핑이 걸리지 않았고, 입력칸이
  // 하나도 없는 화면에 "입력한 내용을 다시 확인해 주세요"가 떴다 (#310)
  AUTH_400_INVALID_LOGIN_CODE: APP_MESSAGE_CODE.auth.signInFailed,
  // 재발급 토큰이 만료·위조된 경우다. 입력 문제가 아니라 세션이 끝난 것이다
  AUTH_400_INVALID_TOKEN: APP_MESSAGE_CODE.common.unauthorized,
  AUTH_404_INVALID_AUTH: APP_MESSAGE_CODE.common.unauthorized,
  AUTH_403_MEMBER_ID_MISMATCH: APP_MESSAGE_CODE.common.forbidden,
  // 인증번호 발송·확인 모두 번호마다 횟수를 센다 — 발송은 1시간에 5회, 확인은 5분에 5회다
  AUTH_429_TOO_MANY_REQUESTS: APP_MESSAGE_CODE.member.tooManyVerifications,

  // **`@MemberId`를 쓰는 모든 엔드포인트가 낸다.** 장바구니·주문·결제·배송지·리뷰 어디서든
  // 가입 미완료 사용자가 받는 코드인데, 매핑이 없어 "권한 없음"만 떴다 (#310)
  SECURITY_403_MISSING_MEMBER_ID: APP_MESSAGE_CODE.member.signupRequired,
  SECURITY_401_UNAUTHORIZED: APP_MESSAGE_CODE.common.unauthorized,

  MEMBER_400_REQUIRED_AGREEMENT_NOT_AGREED: APP_MESSAGE_CODE.member.agreementRequired,
  MEMBER_401_UNAUTHORIZED: APP_MESSAGE_CODE.common.unauthorized,
  MEMBER_409_ALREADY_SIGNED_UP: APP_MESSAGE_CODE.member.alreadySignedUp,
  MEMBER_409_ALREADY_HAVE_NICKNAME: APP_MESSAGE_CODE.member.nicknameTaken,
  // 사진 발급 요청의 확장자를 서버가 거절한 것이다. 카메라의 HEIC가 여기로 온다
  MEMBER_400_INVALID_IMAGE_EXTENSION: APP_MESSAGE_CODE.image.unsupportedType,

  MEMBER_404_NOT_FOUND: APP_MESSAGE_CODE.common.notFound,
  // 마지막 기본 배송지의 체크를 끈 경우다. 같이 고친 이름·연락처까지 무산되므로 무엇을
  // 해야 하는지 알려야 한다 (#310)
  MEMBER_400_LAST_DEFAULT_ADDRESS: APP_MESSAGE_CODE.address.lastDefault,
  MEMBER_404_NOT_FOUND_ADDRESS: APP_MESSAGE_CODE.address.notFound,

  PRODUCT_404_PRODUCT_NOT_FOUND: APP_MESSAGE_CODE.product.notFound,

  REVIEW_409_ALREADY_REVIEWED: APP_MESSAGE_CODE.review.alreadyReviewed,
  REVIEW_403_PURCHASE_NOT_CONFIRMED: APP_MESSAGE_CODE.review.purchaseNotConfirmed,
  REVIEW_400_INVALID_IMAGE_EXTENSION: APP_MESSAGE_CODE.image.unsupportedType,
  REVIEW_409_ALREADY_ANSWERED_FEEDBACK: APP_MESSAGE_CODE.review.feedbackAlreadyAnswered,
  REVIEW_400_FEEDBACK_NOT_AVAILABLE_YET: APP_MESSAGE_CODE.review.feedbackNotAvailableYet,
  REVIEW_404_NOT_FOUND: APP_MESSAGE_CODE.common.notFound,
  NOTIFICATION_404_NOT_FOUND: APP_MESSAGE_CODE.common.notFound,
  PRODUCT_409_INSUFFICIENT_STOCK: APP_MESSAGE_CODE.product.outOfStock,

  // 주문 화면이 직접 부르는 것들이다. 전이 규칙에 막힌 경우가 가장 흔하다 — 목록에서
  // 취소·확정 버튼을 누른 사이에 상태가 움직였을 수 있다 (#310)
  ORDER_409_NOT_CANCELLABLE: APP_MESSAGE_CODE.order.notCancellable,
  ORDER_409_NOT_CONFIRMABLE: APP_MESSAGE_CODE.order.notConfirmable,
  ORDER_409_NOT_CLAIMABLE: APP_MESSAGE_CODE.order.notClaimable,
  ORDER_409_CLAIM_ALREADY_IN_PROGRESS: APP_MESSAGE_CODE.order.claimInProgress,
  ORDER_409_CLAIM_ITEM_QUANTITY_EXCEEDED: APP_MESSAGE_CODE.order.claimQuantityExceeded,
  // 반품·교환 첨부 사진. 확장자 거절은 카메라의 HEIC가 여기로 오고, 소유 확인 실패는 올린
  // 사진이 이 회원 것으로 확인되지 않은 경우다 — 둘 다 다시 골라 올리면 풀린다 (#408)
  ORDER_400_INVALID_IMAGE_EXTENSION: APP_MESSAGE_CODE.image.unsupportedType,
  ORDER_403_FORBIDDEN_IMAGE: APP_MESSAGE_CODE.image.uploadFailed,
  ORDER_404_ITEM_NOT_FOUND: APP_MESSAGE_CODE.order.itemNotFound,
  ORDER_404_ORDER_NOT_FOUND: APP_MESSAGE_CODE.order.notFound,
  ORDER_404_ADDRESS_NOT_FOUND: APP_MESSAGE_CODE.address.notFound,
  ORDER_409_INSUFFICIENT_STOCK: APP_MESSAGE_CODE.product.outOfStock,
  ORDER_404_PRODUCT_NOT_FOUND: APP_MESSAGE_CODE.product.notFound,
  // 담기·주문에서 판매가 멈춘 상품을 만난 경우다. 재고 부족과 달리 기다려도 돌아오지 않는다
  ORDER_409_PRODUCT_NOT_PURCHASABLE: APP_MESSAGE_CODE.product.notPurchasable,
  ORDER_404_CART_ITEM_NOT_FOUND: APP_MESSAGE_CODE.common.notFound,
  // 주문이 딴 서비스를 부르다 막힌 경우다. 사용자가 고칠 것이 없어 다시 시도만 권한다
  ORDER_503_MEMBER_SERVICE_UNAVAILABLE: APP_MESSAGE_CODE.order.temporarilyUnavailable,
  ORDER_503_PRODUCT_SERVICE_UNAVAILABLE: APP_MESSAGE_CODE.order.temporarilyUnavailable,
  ORDER_503_INVENTORY_SERVICE_UNAVAILABLE: APP_MESSAGE_CODE.order.temporarilyUnavailable,

  // 결제 승인이 거절되는 경우다. 결제창은 이미 성공한 뒤라 "다시 시도" 계열 문구를 쓰지 않는다.
  // 나머지는 `payment.confirmFailed`가 받는다 (#260)
  //
  // **금액 불일치는 400이 아니라 409다.** `PaymentErrorCode.AMOUNT_MISMATCH`가
  // `HttpStatus.CONFLICT`에 `"PAYMENT_409_AMOUNT_MISMATCH"`다. 400으로 적어 둔 동안
  // 이 문구가 한 번도 뜨지 않았고, 백엔드가 자동 취소를 건 사실을 알릴 길이 없었다 (#310)
  PAYMENT_409_AMOUNT_MISMATCH: APP_MESSAGE_CODE.payment.amountMismatch,
  PAYMENT_409_NOT_CONFIRMABLE: APP_MESSAGE_CODE.payment.confirmFailed,
  PAYMENT_409_ORDER_NOT_PAYABLE: APP_MESSAGE_CODE.payment.failed,
  PAYMENT_404_ORDER_NOT_FOUND: APP_MESSAGE_CODE.order.notFound,
  PAYMENT_502_TOSS_CONFIRM_FAILED: APP_MESSAGE_CODE.payment.confirmFailed,

  // 백엔드가 아니라 우리 Route Handler(`/api/juso`)가 붙이는 코드다. 행정안전부 응답을 옮긴 것이라
  // `JUSO_` 접두사로 출처를 구분한다. 나머지(키 오류·두 글자 미만)는 기본 문구가 알맞다 —
  // 전자는 사용자가 할 일이 없는 우리 설정 문제이고, 후자는 화면이 이미 막고 있다.
  JUSO_400_KEYWORD_TOO_BROAD: APP_MESSAGE_CODE.address.keywordTooBroad,
  JUSO_400_KEYWORD_INVALID: APP_MESSAGE_CODE.address.keywordInvalid,
};

/** 상태 코드만으로 고르는 기본 문구. 모르는 errorCode가 여기로 떨어진다 */
function messageByStatus(status: number): AppMessageCode {
  if (status === 401) {
    return APP_MESSAGE_CODE.common.unauthorized;
  }
  if (status === 403) {
    return APP_MESSAGE_CODE.common.forbidden;
  }
  if (status === 404) {
    return APP_MESSAGE_CODE.common.notFound;
  }
  if (status === 409) {
    return APP_MESSAGE_CODE.common.conflict;
  }
  if (status >= 500) {
    return APP_MESSAGE_CODE.common.serverError;
  }
  if (status >= 400) {
    return APP_MESSAGE_CODE.common.invalidInput;
  }
  return APP_MESSAGE_CODE.common.requestFailed;
}

/**
 * 실패한 원인에서 보여줄 문구 코드를 고른다.
 *
 * `ApiError`가 아닌 것은 fetch 자체가 실패한 경우다(오프라인·DNS·CORS).
 * 서버에 닿지도 못한 것이라 "연결 실패"로 구분해 알린다 — 사용자가 할 수 있는 일이 다르다.
 */
export function toAppMessageCode(error: unknown): AppMessageCode {
  // S3가 거절한 것이다. 우리 서버 응답이 아니라 `ApiError`가 아니고, 연결 실패도 아니다
  if (error instanceof ImageUploadError) {
    return APP_MESSAGE_CODE.image.uploadFailed;
  }
  if (!(error instanceof ApiError)) {
    return error instanceof TypeError
      ? APP_MESSAGE_CODE.common.networkError
      : APP_MESSAGE_CODE.common.requestFailed;
  }

  // `errorCode && ...`로 쓰면 빈 문자열이 그대로 흘러 `??`를 지나친다. 있는지 먼저 가른다.
  const errorCode = error.problem?.errorCode;
  const mapped = errorCode ? MESSAGE_BY_ERROR_CODE[errorCode] : undefined;
  return mapped ?? messageByStatus(error.status);
}
