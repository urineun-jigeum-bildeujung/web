// 반려동물 등록 훅. 화면은 `useMutation`을 직접 부르지 않는다 (code-convention "훅").

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadImage } from "@/shared/api/upload-image";
import { QUERY_KEYS } from "@/shared/config/query-keys";

import type { PetRegisterRequest } from "../model/to-register-request";
import { registerPet } from "./register-pet";

type RegisterPetInput = {
  request: PetRegisterRequest;
  /** 골라 둔 사진. 있으면 먼저 올리고 그 주소를 실어 보낸다 */
  photo: File | null;
};

/**
 * 프로필을 등록한다. 사진이 있으면 S3에 올린 뒤 그 주소와 함께 등록한다.
 *
 * **업로드를 훅 안에 두는 이유가 있다.** 화면이 따로 올리면 `isSubmitting`이 업로드 시간을
 * 덮지 못해 그동안 버튼이 멈춰 보이고, 실패도 전역 알림 경로를 지나지 않는다.
 *
 * 성공하면 아이 목록을 무효화한다. 마이페이지·메인의 아이 고르기가 같은 캐시를 보므로
 * 비우지 않으면 방금 등록한 아이가 한참 뒤에야 보인다.
 */
export function useMutateRegisterPet() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ request, photo }: RegisterPetInput) => {
      const image = photo ? await uploadImage(photo) : undefined;
      return registerPet({ ...request, ...(image && { image }) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pet.list() }),
  });

  return {
    registerPet: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
  };
}
