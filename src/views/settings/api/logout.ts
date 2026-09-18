// 로그아웃 요청. 서버에 남은 세션까지 끊는다.
//
// **기기에서 토큰만 지우면 모자라다.** 서버의 refreshToken이 그대로 살아 있어, 그것을 쥔
// 쪽은 계속 재발급을 받을 수 있다. 이 요청이 accessToken을 블랙리스트에 올리고 저장된
// refreshToken을 지운다.

import { apiRequest } from "@/shared/api/client";

export function logout(): Promise<void> {
  return apiRequest<void>("/auths/logout", { method: "POST" });
}
