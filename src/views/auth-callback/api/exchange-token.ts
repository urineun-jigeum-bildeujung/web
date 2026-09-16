// 소셜 인증이 넘긴 일회용 code를 토큰 쌍으로 바꾼다.
//
// 백엔드는 리다이렉트 쿼리로 토큰을 직접 주지 않는다. 주소창·리퍼러·브라우저 기록에 토큰이
// 남기 때문이다. 대신 60초짜리 일회용 `code`만 넘기고 프론트가 본문으로 교환한다.
// 아직 토큰이 없는 상태라 `auth: false`로 Authorization을 붙이지 않는다.

import { apiRequest } from "@/shared/api/client";

/** 백엔드 `LoginCodePayload`와 같은 모양이다 */
export type TokenExchangeResult = {
  accessToken: string;
  refreshToken: string;
  /** 백엔드가 만든 추천 닉네임. 가입 화면의 초기값으로 쓴다 */
  nickname: string;
  /**
   * 회원가입(닉네임·약관)을 아직 안 끝냈는가.
   *
   * 신규 회원 여부(`isNewUser`)가 아니라 이 값을 본다. 첫 로그인에서 가입을 마치지 않고
   * 이탈한 사람은 다시 로그인하면 더 이상 신규가 아니어서, 신규 여부로 가르면 가입 화면에
   * 영영 닿지 못한다.
   */
  needsSignup: boolean;
};

export function exchangeToken(code: string): Promise<TokenExchangeResult> {
  return apiRequest<TokenExchangeResult>("/auths/token/exchange", {
    method: "POST",
    body: { code },
    auth: false,
  });
}
