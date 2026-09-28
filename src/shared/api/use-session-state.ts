// 로그인 여부를 세 상태로 읽는 훅. 서버 렌더와 하이드레이션 첫 렌더에서는 아직 모른다(`null`)고 답한다.
//
// `useHasSession`은 서버에서 늘 거짓이라, 로그인한 사람이 서버가 그린 화면을 받으면 첫 화면이 로그아웃
// 모양으로 나갔다가 하이드레이션 뒤 로그인 모양으로 바뀌며 아래 구역이 밀렸다(#470 리뷰). 모르는 동안
// 뼈대를 그릴 수 있게 셋째 상태를 둔다. 세션이 끊기면 따라오는 것은 `useHasSession`과 같다.

import { useSyncExternalStore } from "react";

import { hasSession, subscribeTokensCleared } from "./token-store";

/** 로그인했으면 true, 아니면 false, 서버 렌더·하이드레이션 중이라 아직 모르면 null */
export function useSessionState(): boolean | null {
  return useSyncExternalStore(subscribeTokensCleared, hasSession, () => null);
}
