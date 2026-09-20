// 아이 정보를 고치는 훅. 화면은 `useMutation`을 직접 부르지 않는다 (code-convention "훅").

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { updatePet, type PetUpdate } from "./pets";

/**
 * 고친 값을 저장한다.
 *
 * **목록과 상세를 함께 무효화한다.** 이름이 바뀌면 아이 전환 줄도 달라지는데, 상세만
 * 비우면 돌아간 화면이 옛 이름을 보인다 — 방금 고친 사람에게는 저장이 안 된 것으로 읽힌다.
 */
export function useMutateUpdatePet(petId: string | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (patch: PetUpdate) => updatePet(petId as string, patch),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pet.list() }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pet.detail(petId ?? "") }),
      ]);
    },
  });

  return {
    updatePet: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
