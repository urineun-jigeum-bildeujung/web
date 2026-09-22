// 이 기기의 FCM 등록 토큰을 서버에 알린다. 백엔드는 이 토큰으로 푸시를 보낸다.
//
// 해제 API는 아직 없다(백엔드가 나중에 보탄다). 스위치를 끄면 브라우저 쪽 토큰만 지운다.

import { apiRequest } from "@/shared/api/client";

export function registerFcmToken(token: string): Promise<void> {
  return apiRequest<void>("/notifications/fcm-tokens", { method: "POST", body: { token } });
}
