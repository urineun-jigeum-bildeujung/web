// 정보 수정 화면이 저장된 값을 못 받았을 때 그 까닭을 알린다.
//
// **잠긴 입력칸만 보이면 고장으로 읽힌다.** 세 화면이 같은 사정을 겪어 한곳에 둔다.

import type { ReactNode } from "react";

import { EditPetSkeleton } from "./edit-pet-skeleton";

type EditPetStatusProps = {
  /** 주소에 `petId`가 없다. 어느 아이를 고칠지 모른다 */
  missingPetId: boolean;
  isLoading: boolean;
  error: unknown;
};

export function EditPetStatus({ missingPetId, isLoading, error }: EditPetStatusProps) {
  // 받아오는 중에는 문구 한 줄이 아니라 화면 골격으로 자리를 잡는다. 빈 화면이었다가
  // 갑자기 차면 눌리는 자리가 밀린다
  if (isLoading && !missingPetId && !error) {
    return <EditPetSkeleton />;
  }

  let message: ReactNode = null;
  if (missingPetId) {
    message = "고칠 아이를 찾지 못했어요. 아이 관리에서 다시 들어와 주세요";
  } else if (error) {
    message = "아이 정보를 불러오지 못했어요";
  }

  if (!message) {
    return null;
  }

  return (
    <p role="alert" className="px-5 text-body-medium-14 text-text-body-secondary">
      {message}
    </p>
  );
}
