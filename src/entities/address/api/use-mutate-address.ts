// 배송지를 등록·수정하는 훅. 화면은 `useMutation`을 직접 부르지 않는다 (code-convention "훅").
//
// **실패 토스트를 여기서 띄우지 않는다.** `AppProviders`의 `MutationCache.onError`가 이미
// 전역으로 띄운다. 훅에서 또 띄우면 두 번 뜬다 (#214에서 겪음).

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { createAddress, updateAddress, type SaveAddressRequest } from "./addresses";

/**
 * 새 배송지를 등록하거나 이미 있는 곳을 고친다.
 *
 * **낙관적으로 그리지 않는다.** 장바구니 수량과 달리 이 화면은 저장한 뒤 곧바로 떠나므로
 * 미리 그려 둘 자리가 없고, 등록은 서버가 만들어 주는 `addressId`를 받아야 이어진다.
 */
export function useMutateAddress() {
  const queryClient = useQueryClient();
  const settle = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.address.all });

  const creation = useMutation({
    mutationFn: createAddress,
    onSettled: settle,
  });

  const update = useMutation({
    mutationFn: ({
      addressId,
      request,
    }: {
      addressId: number;
      request: Partial<SaveAddressRequest>;
    }) => updateAddress(addressId, request),
    onSettled: settle,
  });

  return {
    /** 등록하고 생긴 `addressId`를 돌려준다 */
    create: creation.mutateAsync,
    update: update.mutateAsync,
    isSaving: creation.isPending || update.isPending,
  };
}
