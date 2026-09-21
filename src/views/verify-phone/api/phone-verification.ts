// 휴대폰 인증번호 발송·확인 요청.
//
// **번호는 숫자만 보낸다.** 서버가 Redis 키(`P<번호>`)로 쓰기 때문에 하이픈이 섞이면
// 발송과 확인이 서로 다른 키를 본다. 화면은 보기 좋으라고 하이픈을 두므로 여기서 턴다.

import { apiRequest } from "@/shared/api/client";

import type { CarrierCode } from "../model/carriers";

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
 * 인증번호가 서버에 보낼 수 있는 모양인지 본다.
 *
 * **`inputMode="numeric"`은 붙여넣기를 막지 않는다.** `12ab`가 그대로 들어오면
 * `Number()`가 `NaN`이 되고, `JSON.stringify`가 그것을 `null`로 적어 `int` 계약이 깨진다.
 * 서버는 본문을 통째로 거절하므로 보내기 전에 거른다.
 */
export function isSendableCode(code: string): boolean {
  return /^\d+$/.test(code) && Number.isSafeInteger(Number(code));
}

/**
 * 인증번호를 확인한다. 맞으면 `true`다.
 *
 * **`code`를 숫자로 보낸다.** 백엔드가 `int`로 받아서 문자열을 주면 본문을 통째로 거절한다.
 */
export async function confirmVerification(phone: string, code: string): Promise<boolean> {
  if (!isSendableCode(code)) {
    return false;
  }

  const { verified } = await apiRequest<{ verified: boolean }>("/auths/phone/verify-confirm", {
    method: "POST",
    body: { phone: digitsOf(phone), code: Number(code) },
  });
  return verified;
}

/**
 * 인증한 번호를 회원 정보에 저장한다.
 *
 * **서버가 `code`를 다시 검증한다.** member-service가 내부 API로 auth-service에
 * "이 번호 인증됐나"를 되묻는다 — 프론트 주장만 믿지 않는다. 그래서 화면이 인증번호를
 * 완료 버튼까지 들고 있어야 한다.
 */
export function savePhone(phone: string, carrier: CarrierCode, code: string): Promise<void> {
  return apiRequest<void>("/members/me/phone", {
    method: "PATCH",
    body: { phone: digitsOf(phone), carrier, code: Number(code) },
  });
}
