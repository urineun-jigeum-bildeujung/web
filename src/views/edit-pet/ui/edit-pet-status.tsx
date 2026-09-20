// 정보 수정 화면이 저장된 값을 못 받았을 때 그 까닭을 알린다.
//
// **잠긴 입력칸만 보이면 고장으로 읽힌다.** 세 화면이 같은 사정을 겪어 한곳에 둔다.

import type { ReactNode } from "react";

type EditPetStatusProps = {
  /** 주소에 `petId`가 없다. 어느 아이를 고칠지 모른다 */
  missingPetId: boolean;
  isLoading: boolean;
  error: unknown;
};

export function EditPetStatus({ missingPetId, isLoading, error }: EditPetStatusProps) {
  let message: ReactNode = null;
  if (missingPetId) {
    message = "고칠 아이를 찾지 못했어요. 아이 관리에서 다시 들어와 주세요";
  } else if (error) {
    message = "아이 정보를 불러오지 못했어요";
  } else if (isLoading) {
    message = "아이 정보를 불러오는 중이에요";
  }

  if (!message) {
    return null;
  }

  return (
    <p
      role={missingPetId || error ? "alert" : "status"}
      className="px-5 text-body-medium-14 text-text-body-secondary"
    >
      {message}
    </p>
  );
}
