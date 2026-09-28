// 아이 체형 수정 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
import { Suspense } from "react";

import { EditPetSkeleton } from "@/views/edit-pet";

import { EditPetBodyView } from "@/views/edit-pet";

export default function EditPetBodyPage() {
  // 어느 아이를 고치는지 useQueryState로 읽는다(#268).
  // Suspense로 감싸지 않으면 정적 프리렌더가 실패한다.
  return (
    <Suspense fallback={<EditPetSkeleton />}>
      <EditPetBodyView />
    </Suspense>
  );
}
