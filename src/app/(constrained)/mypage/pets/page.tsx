// 반려동물 프로필 관리 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
import { Suspense } from "react";

import { PetProfileView } from "@/views/pet-profile";

export default function PetsPage() {
  // useQueryState가 내부에서 useSearchParams를 쓴다.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <PetProfileView />
    </Suspense>
  );
}
