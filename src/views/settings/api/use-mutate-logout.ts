// 로그아웃 훅. 화면은 `useMutation`을 직접 부르지 않는다 (code-convention "훅").

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { clearTokens } from "@/shared/api/token-store";

import { logout } from "./logout";

/**
 * 서버 세션을 끊고 기기의 토큰을 지운다.
 *
 * **요청이 실패해도 기기의 토큰은 지운다.** 서버 정리에 실패했다고 로그아웃을 막으면
 * 남의 기기에서 빠져나올 방법이 없어진다. `onSettled`에 두는 이유다.
 *
 * **로그인 화면으로는 여기서 보내지 않는다.** `clearTokens()`가 `subscribeTokensCleared`를
 * 울리고 `SessionExpiryRedirect`가 이미 보낸다(#230). 화면에서 또 보내면 이동이 겹친다.
 *
 * 캐시도 비운다. 남겨 두면 다음 사람이 앞 사람의 아이 목록을 잠깐 보게 된다.
 */
export function useMutateLogout() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearTokens();
      queryClient.clear();
    },
  });

  return {
    logout: mutation.mutateAsync,
    isLoggingOut: mutation.isPending,
  };
}
