// 정보 수정 세 화면이 함께 쓰는 자리. 어느 아이를 고치는지 정하고 저장까지 잇는다.
//
// **세 화면이 같은 일을 한다.** 쿼리에서 `petId`를 읽고, 상세를 받아 채우고, 고친 것만
// 보내고, 끝나면 돌아간다. 각자 두면 한 곳만 고쳐지는 일이 생긴다.

"use client";

import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";

import { useMutateUpdatePet, useQueryPetDetail, type PetUpdate } from "@/entities/pet";
import { toAppMessageCode } from "@/shared/api/error-message";
import { toastAppError } from "@/shared/lib/app-toast";

export function useEditPet() {
  const router = useRouter();
  // 아이 관리 카드의 화살표가 실어 보낸다. 없으면 고칠 아이를 모른다
  const [rawPetId] = useQueryState("petId");
  // `?petId=`처럼 비어 있는 것도 없는 것과 같다. 한 번 고르고 조회·저장·판정이 같은 값을 쓴다
  const petId = rawPetId?.trim() || undefined;
  const { pet, isLoading, error } = useQueryPetDetail(petId);
  const { updatePet, isSaving } = useMutateUpdatePet(petId);

  /** 고친 것만 보낸다. 저장되면 앞 화면으로 돌아간다 */
  const save = (patch: PetUpdate) => {
    updatePet(patch)
      .then(() => router.back())
      .catch((causedBy: unknown) => toastAppError(toAppMessageCode(causedBy), causedBy));
  };

  return {
    pet,
    // 고칠 아이를 모르면 받아올 것도 없다. 부르는 쪽이 그 사실을 알린다
    missingPetId: petId === undefined,
    isLoading,
    error,
    isSaving,
    save,
  };
}
