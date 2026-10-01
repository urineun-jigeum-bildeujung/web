// 기본 아이를 바꾸는 훅. 화면은 `useMutation`을 직접 부르지 않는다 (code-convention "훅").

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { changeDefaultPet } from "./pets";

/**
 * 기본 아이를 바꾼다(#531). 상품 상세 적합도·결제·맞춤 추천이 모두 기본 아이로 시작하므로
 * 여기서 바꾼 아이가 그 화면들까지 따라간다.
 *
 * **요청은 누른 순서대로 하나씩 보낸다(`scope`).** 보리를 누르고 곧바로 두부를 누르면 두 요청이
 * 함께 나가, 두부가 먼저 끝나고 보리가 나중에 끝나면 화면은 두부인데 서버 기본 아이는 보리가 된다.
 * 같은 scope는 앞 요청이 끝나야 다음이 나가므로 서버에는 마지막으로 누른 아이가 남는다.
 *
 * **목록과 상세를 함께 무효화한다.** 목록은 기본 아이를 앞으로 세워 순서가 바뀌고, 상세도
 * `isDefault`를 싣는다. 실패 알림은 전역(`MutationCache`)이 맡는다.
 */
export function useMutateChangeDefaultPet() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    scope: { id: "change-default-pet" },
    mutationFn: changeDefaultPet,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pet.list() }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pet.detailAll() }),
      ]);
    },
  });

  return {
    changeDefaultPet: mutation.mutateAsync,
    isChanging: mutation.isPending,
  };
}
