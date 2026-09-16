// 약관 동의와 닉네임을 보내 회원가입을 마친다.
//
// **응답 토큰으로 기존 토큰을 갈아끼워야 한다.** `memberId`는 가입을 끝내야 생기는 값이라
// 로그인 직후 받은 JWT에는 들어 있지 않다. 백엔드가 가입 응답으로 `memberId`가 담긴 새 토큰
// 쌍을 주므로, 그것으로 바꾸지 않으면 이후 회원 API가 누구의 요청인지 알지 못한다.
//
// 이 요청 자체는 로그인 직후의 토큰으로 보낸다(`@AuthId`). 그래서 `auth: false`가 아니다.

import { apiRequest } from "@/shared/api/client";
import { saveTokens } from "@/shared/api/token-store";

import { AGREEMENT_TYPE_BY_ID } from "../model/agreements";

/** 백엔드 `SignupResponse`와 같은 모양이다 */
type SignupResponse = {
  accessToken: string;
  refreshToken: string;
};

export type SignupRequest = {
  nickname: string;
  /** 화면에서 고른 약관 id 목록. 고르지 않은 항목은 `agreed: false`로 함께 보낸다 */
  checkedIds: string[];
};

/**
 * 회원가입을 마치고 토큰을 교체한다.
 *
 * 동의하지 않은 항목도 빼지 않고 `agreed: false`로 보낸다. 빠진 항목과 거절한 항목은
 * 다른 사실이고, 선택 약관은 거절 기록 자체가 남아야 한다.
 */
export async function signUp({ nickname, checkedIds }: SignupRequest): Promise<void> {
  const tokens = await apiRequest<SignupResponse>("/members/signup", {
    method: "POST",
    body: {
      nickname,
      agreements: Object.entries(AGREEMENT_TYPE_BY_ID).map(([id, type]) => ({
        type,
        agreed: checkedIds.includes(id),
      })),
    },
  });

  saveTokens(tokens);
}
