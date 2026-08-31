// 온보딩 프로필 등록 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
import { Suspense } from "react";

import { OnboardingView } from "@/views/onboarding";

export default function OnboardingPage() {
  // nuqs의 useQueryState가 내부에서 useSearchParams를 쓴다.
  // Suspense로 감싸지 않으면 정적 프리렌더가 실패한다.
  return (
    <Suspense>
      <OnboardingView />
    </Suspense>
  );
}
