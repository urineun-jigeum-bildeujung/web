// 반려동물 등록 훅. 화면은 `useMutation`을 직접 부르지 않는다 (code-convention "훅").

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import type { PetRegisterRequest } from "../model/to-register-request";
import { registerPet } from "./register-pet";

/**
 * 프로필을 등록한다.
 *
 * 성공하면 아이 목록을 무효화한다. 마이페이지·메인의 아이 고르기가 같은 캐시를 보므로
 * 비우지 않으면 방금 등록한 아이가 한참 뒤에야 보인다.
 */
export function useMutateRegisterPet() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: PetRegisterRequest) => registerPet(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pet.list() }),
  });

  return {
    registerPet: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
  };
}
