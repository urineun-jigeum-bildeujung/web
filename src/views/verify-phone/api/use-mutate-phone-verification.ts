// 인증번호 발송·확인 훅. 화면은 `useMutation`을 직접 부르지 않는다 (code-convention "훅").

import { useMutation } from "@tanstack/react-query";

import { confirmVerification, requestVerification } from "./phone-verification";

/**
 * 발송과 확인을 한 훅으로 낸다. 한 화면에서 이어 쓰는 두 단계라 함께 둔다.
 *
 * 서버가 번호마다 횟수를 센다 — 발송은 1시간에 5회, 확인은 5분에 5회다. 넘으면
 * `TOO_MANY_REQUESTS`가 오므로 부르는 쪽이 그 사실을 알린다.
 */
export function useMutatePhoneVerification() {
  const send = useMutation({ mutationFn: requestVerification });
  const confirm = useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      confirmVerification(phone, code),
  });

  return {
    requestCode: send.mutateAsync,
    isRequesting: send.isPending,
    confirmCode: confirm.mutateAsync,
    isConfirming: confirm.isPending,
  };
}
