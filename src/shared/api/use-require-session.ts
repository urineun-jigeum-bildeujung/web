// 로그인해야 쓸 수 있는 버튼·링크가 부른다. 비로그인이면 로그인 필요 토스트를 띄우고 막는다 (#542).
//
// 비로그인은 메인·상품 상세·검색만 볼 수 있다. 그 화면들 안의 기능 버튼을 누르면 이동하지 않고
// 토스트만 띄우기로 했다(PM·PD, 2026-09-29). 화면마다 세션을 읽으면 한 곳이 빠지는 순간 401만 헛돈다.

import { toastAppError } from "@/shared/lib/app-toast";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";

import { useSessionState } from "./use-session-state";

/**
 * 누른 순간 부르는 확인 함수를 돌려준다. 로그인했으면 true다.
 *
 * 로그인 여부를 아직 모르면(서버 렌더·하이드레이션 중) 토스트 없이 false다 — 로그인한 사람에게
 * 로그인하라고 띄우지 않는다. 링크는 false일 때 `event.preventDefault()`로 이동을 막는다.
 */
export function useRequireSession(): () => boolean {
  const session = useSessionState();

  return () => {
    if (session === false) {
      toastAppError(APP_MESSAGE_CODE.auth.loginRequired);
    }
    return session === true;
  };
}
