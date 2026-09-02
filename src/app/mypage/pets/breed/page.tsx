// /mypage/pets/breed 라우트. 화면 조립은 views/select-breed에 있다.

import { Suspense } from "react";

import { SelectBreedView } from "@/views/select-breed";

export default function SelectBreedPage() {
  // nuqs의 useQueryState가 내부에서 useSearchParams를 쓴다.
  // Suspense로 감싸지 않으면 정적 프리렌더가 실패한다.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <SelectBreedView />
    </Suspense>
  );
}
