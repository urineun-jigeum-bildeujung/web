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

/**
 * 백엔드 errorCode에 우리 문구를 붙인다.
 * 여기 없는 코드는 상태 코드 기준 기본 문구로 간다 — 매핑을 다 채우지 않아도 화면은 돈다.
 *
 * 내부 통신용 코드(`MISSING_AUTH_ID`·`INVALID_INTERNAL_SECRET`·`PRODUCT_409_STOCK_MOVEMENT_*`)와
 * 프론트 구현 실수에 가까운 코드(`PRODUCT_400_INVALID_CURSOR`)는 넣지 않았다.
 * 사용자가 볼 일이 없고, 보이더라도 기본 문구가 더 알맞다.
 */
const MESSAGE_BY_ERROR_CODE: Record<string, AppMessageCode> = {
  COMMON_400: APP_MESSAGE_CODE.common.invalidInput,
  COMMON_500: APP_MESSAGE_CODE.common.serverError,

  AUTH_400: APP_MESSAGE_CODE.auth.signInFailed,

  MEMBER_400_REQUIRED_AGREEMENT_NOT_AGREED: APP_MESSAGE_CODE.member.agreementRequired,
  MEMBER_401_UNAUTHORIZED: APP_MESSAGE_CODE.common.unauthorized,
  MEMBER_409_ALREADY_SIGNED_UP: APP_MESSAGE_CODE.member.alreadySignedUp,
  MEMBER_409_ALREADY_HAVE_NICKNAME: APP_MESSAGE_CODE.member.nicknameTaken,

  PRODUCT_404_PRODUCT_NOT_FOUND: APP_MESSAGE_CODE.product.notFound,
  PRODUCT_409_INSUFFICIENT_STOCK: APP_MESSAGE_CODE.product.outOfStock,

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
