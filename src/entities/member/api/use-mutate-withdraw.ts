// 회원 탈퇴 훅. 화면은 `useMutation`을 직접 부르지 않는다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { clearTokens } from "@/shared/api/token-store";

import { withdraw } from "./profile";

/**
 * 탈퇴하고 기기의 흔적을 지운다.
 *
 * **로그아웃과 같은 뒷정리가 필요하다.** 서버가 토큰을 무효로 만들었으므로 기기에 남은
 * 것도 비운다. 로그인 화면으로는 여기서 보내지 않는다 — `clearTokens()`가 울리는 알림을
 * `SessionExpiryRedirect`가 이미 받는다(#230).
 *
 * **실패하면 아무것도 지우지 않는다.** 로그아웃과 다른 점이다. 탈퇴가 안 됐는데 토큰만
 * 비우면 계정은 살아 있는 채로 쫓겨나고, 다시 들어와도 탈퇴됐는지 알 수 없다.
 */
export function useMutateWithdraw() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: withdraw,
    onSuccess: () => {
      clearTokens();
      queryClient.clear();
    },
  });

  return {
    withdraw: mutation.mutateAsync,
    isWithdrawing: mutation.isPending,
  };
}
