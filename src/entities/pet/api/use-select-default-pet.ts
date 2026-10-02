// 고른 아이를 기본(대표) 아이로 바꾸고, 서버가 받으면 누구로 바뀌었는지 알리는 훅. 메인과 맞춤 추천이 같이 쓴다.

import { useRef } from "react";

import { showSnackbar } from "@/shared/ui/snackbar/snackbar";

import { defaultPetChangedMessage } from "../model/default-pet-notice";
import { useMutateChangeDefaultPet } from "./use-mutate-change-default-pet";

type SelectedPet = { id: string; name: string };

/**
 * 고른 아이를 기본 아이로 보낸다(#531, QA HM-059 #657). 화면은 표시할 아이를 먼저 옮기고 이 함수를 부른다.
 *
 * - **알림은 서버가 받은 뒤에 띄운다.** 먼저 띄우면 실패했을 때 "바뀌었어요"가 거짓이 된다.
 * - **마지막 선택만 알리고 되돌린다.** 앞선 선택의 요청이 늦게 끝나도 알리거나 되돌리지 않는다. 같은
 *   아이를 다시 고르는 것도 다른 선택이라 아이 번호가 아니라 순번으로 가린다(#531 리뷰).
 * - 실패 알림은 전역(`MutationCache`)이 띄우고, 여기서는 화면이 준 `onFail`로 표시를 되돌린다.
 * - 요청은 변경 훅이 누른 순서대로 하나씩 보낸다(`scope`).
 */
export function useSelectDefaultPet() {
  const { changeDefaultPet } = useMutateChangeDefaultPet();
  const latestPick = useRef(0);

  return (pet: SelectedPet, onFail: () => void) => {
    const pick = ++latestPick.current;
    changeDefaultPet(pet.id).then(
      () => {
        if (latestPick.current === pick) showSnackbar(defaultPetChangedMessage(pet.name));
      },
      () => {
        if (latestPick.current === pick) onFail();
      },
    );
  };
}
