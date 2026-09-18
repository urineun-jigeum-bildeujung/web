// 휴대폰 인증번호 발송·확인 요청.
//
// **번호는 숫자만 보낸다.** 서버가 Redis 키(`P<번호>`)로 쓰기 때문에 하이픈이 섞이면
// 발송과 확인이 서로 다른 키를 본다. 화면은 보기 좋으라고 하이픈을 두므로 여기서 턴다.

import { apiRequest } from "@/shared/api/client";

/** 백엔드 `PhoneVerificationSendResponse`와 같은 모양이다 */
export type VerificationSent = {
  /** 인증번호가 살아 있는 시간. 지금은 180초다 */
  expiresInSeconds: number;
};

export function digitsOf(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function requestVerification(phone: string): Promise<VerificationSent> {
  return apiRequest<VerificationSent>("/auths/phone/verify-request", {
    method: "POST",
    body: { phone: digitsOf(phone) },
  });
}

/**
 * 인증번호를 확인한다. 맞으면 `true`다.
 *
 * **`code`를 숫자로 보낸다.** 백엔드가 `int`로 받아서 문자열을 주면 본문을 통째로 거절한다.
 */
export async function confirmVerification(phone: string, code: string): Promise<boolean> {
  const { verified } = await apiRequest<{ verified: boolean }>("/auths/phone/verify-confirm", {
    method: "POST",
    body: { phone: digitsOf(phone), code: Number(code) },
  });
  return verified;
}
