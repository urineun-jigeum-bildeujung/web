// 토스트를 띄우는 유일한 통로. 호출부는 문구가 아니라 메시지 코드만 넘긴다.
//
// 호출부가 title·description을 직접 조립하면 같은 상황에 다른 문구가 나가고,
// 문구를 고칠 때 화면을 전부 뒤져야 한다. 코드만 넘기면 문구는 한곳에서만 바뀐다.

import { toast } from "sonner";

import { APP_MESSAGE, type AppMessage, type AppMessageCode } from "@/shared/config/app-message";

import { reportError } from "./report-error";

/**
 * 포그라운드로 온 푸시를 알린다. **문구를 직접 받는 유일한 토스트다.**
 *
 * 다른 토스트는 코드로 문구를 찾지만 푸시 제목·본문은 서버가 그때그때 정하는 값이라 여기 둘 수 없다.
 * 탭이 보이는 동안은 서비스 워커가 알림을 띄우지 않아, 이것이 없으면 그 푸시는 어디에도 보이지 않는다.
 */
export function toastPushMessage(title: string, description?: string) {
  toast.info(title, { description });
}

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
