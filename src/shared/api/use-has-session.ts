// 로그인돼 있는지를 렌더에 맞춰 읽는 훅. 서버 렌더에서는 늘 아니다.
//
// `hasSession()`은 메모리·localStorage를 바로 읽는 함수라 세션이 끊길 때 화면이 따라오지 않는다.
// `subscribeTokensCleared`로 끊김만 듣고, 로그인은 화면 이동이 따라와 다시 그려진다.

import { useSyncExternalStore } from "react";

import { hasSession, subscribeTokensCleared } from "./token-store";

export function useHasSession(): boolean {
  return useSyncExternalStore(subscribeTokensCleared, hasSession, () => false);
}
