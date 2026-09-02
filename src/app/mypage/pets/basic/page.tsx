// 아이 기본 정보 수정 라우트.
import { Suspense } from "react";

import { EditPetBasicView } from "@/views/edit-pet";

export default function EditPetBasicPage() {
  // 품종 선택 화면이 돌려준 값을 useQueryState로 읽는다.
  // Suspense로 감싸지 않으면 정적 프리렌더가 실패한다.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <EditPetBasicView />
    </Suspense>
  );
}
