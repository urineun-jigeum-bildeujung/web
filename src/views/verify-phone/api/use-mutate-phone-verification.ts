// 인증번호 발송·확인 훅. 화면은 `useMutation`을 직접 부르지 않는다 (code-convention "훅").

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import type { CarrierCode } from "../model/carriers";
import { confirmVerification, requestVerification, savePhone } from "./phone-verification";

/**
 * 발송과 확인을 한 훅으로 낸다. 한 화면에서 이어 쓰는 두 단계라 함께 둔다.
 *
 * 서버가 번호마다 횟수를 센다 — 발송은 1시간에 5회, 확인은 5분에 5회다. 넘으면
 * `TOO_MANY_REQUESTS`가 오므로 부르는 쪽이 그 사실을 알린다.
 */
export function useMutatePhoneVerification() {
  const queryClient = useQueryClient();
  const send = useMutation({ mutationFn: requestVerification });
  const confirm = useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      confirmVerification(phone, code),
  });

  // 저장하면 조회를 무효화한다. 하지 않으면 내 정보 화면이 옛 번호를 보인다 —
  // 방금 인증한 사람에게는 저장이 안 된 것으로 읽힌다
  const save = useMutation({
    mutationFn: ({ phone, carrier, code }: { phone: string; carrier: CarrierCode; code: string }) =>
      savePhone(phone, carrier, code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me() }),
  });

  return {
    requestCode: send.mutateAsync,
    isRequesting: send.isPending,
    confirmCode: confirm.mutateAsync,
    isConfirming: confirm.isPending,
    savePhone: save.mutateAsync,
    isSaving: save.isPending,
  };
}
