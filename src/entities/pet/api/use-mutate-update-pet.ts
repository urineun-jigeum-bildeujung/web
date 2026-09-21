// 아이 정보를 고치는 훅. 화면은 `useMutation`을 직접 부르지 않는다 (code-convention "훅").

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadImage } from "@/shared/api/upload-image";
import { QUERY_KEYS } from "@/shared/config/query-keys";

import { updatePet, type PetUpdate } from "./pets";

type UpdatePetInput = {
  patch: PetUpdate;
  /** 새로 고른 사진. 있으면 먼저 올리고 그 주소를 `image`로 실어 보낸다 */
  photo?: File | null;
};

/**
 * 고친 값을 저장한다. 사진을 새로 골랐으면 S3에 올린 뒤 그 주소와 함께 보낸다.
 *
 * 업로드를 훅 안에 두어 `isSaving`이 그 시간까지 덮고, 실패가 전역 알림 경로를 지난다.
 *
 * **목록과 상세를 함께 무효화한다.** 이름이 바뀌면 아이 전환 줄도 달라지는데, 상세만
 * 비우면 돌아간 화면이 옛 이름을 보인다 — 방금 고친 사람에게는 저장이 안 된 것으로 읽힌다.
 */
export function useMutateUpdatePet(petId: string | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ patch, photo }: UpdatePetInput) => {
      const image = photo ? await uploadImage(photo) : undefined;
      return updatePet(petId as string, { ...patch, ...(image && { image }) });
    },
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
