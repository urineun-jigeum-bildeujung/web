// 내 회원 정보를 고치는 훅. 화면은 `useMutation`을 직접 부르지 않는다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { updateMyProfile } from "./profile";

/**
 * 고친 값을 저장한다.
 *
 * 저장하면 조회를 무효화한다. 무효화하지 않으면 돌아온 화면이 옛 닉네임을 보인다 —
 * 방금 고친 사람에게는 저장이 안 된 것으로 읽힌다.
 */
export function useMutateMyProfile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me() }),
  });

  return {
    updateProfile: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
