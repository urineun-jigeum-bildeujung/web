// 토스트를 띄우는 유일한 통로. 호출부는 문구가 아니라 메시지 코드만 넘긴다.
//
// 호출부가 title·description을 직접 조립하면 같은 상황에 다른 문구가 나가고,
// 문구를 고칠 때 화면을 전부 뒤져야 한다. 코드만 넘기면 문구는 한곳에서만 바뀐다.

import { toast } from "sonner";

import { APP_MESSAGE, type AppMessage, type AppMessageCode } from "@/shared/config/app-message";

import { reportError } from "./report-error";

export function toastAppSuccess(code: AppMessageCode) {
  // description이 없는 문구가 섞여 있어 좁은 타입으로 받는다. 단언 없이 union이 풀린다.
  const { title, description }: AppMessage = APP_MESSAGE[code];
  toast.success(title, { description });
}

/**
 * 실패를 알린다.
 *
 * `cause`로 넘긴 원본은 화면에 닿지 않는다. `reportError`가 성격만 뽑아 남기고
 * 응답 본문은 버린다 — 백엔드 `detail`은 사용자가 볼 것도, 로그에 남길 것도 아니다.
 */
export function toastAppError(code: AppMessageCode, cause?: unknown) {
  const { title, description }: AppMessage = APP_MESSAGE[code];
  if (cause !== undefined) {
    reportError(code, cause);
  }
  toast.error(title, { description });
}
