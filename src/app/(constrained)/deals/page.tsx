// /deals 라우트. 화면 조립은 views/deals에 있다.
//
// 진행중·오픈예정 두 상태를 각각 서버에서 조회한다(#282). 둘 다 await하지 않고 그대로
// DealsView에 넘겨 즉시 병렬로 시작시킨다 — 탭 전환은 이미 둘 다 받아 둔 데이터를
// 보여주는 것뿐이라 서버를 다시 부르지 않는다.

import { Suspense } from "react";

import { getTimeDeals } from "@/entities/product";
import { DealsView } from "@/views/deals";

// searchParams를 안 읽어 자동으로 동적 렌더링되지 않는다 — 명시하지 않으면 `next build`가
// 이 조회 결과를 정적 HTML에 구워 넣고, 이후 모든 요청이 그 오래된 딜·카운트다운을 본다.
// 게다가 빌드 시점엔 서버 전용 base URL이 없을 수 있어 빌드 자체가 실패할 수도 있다(#282).
export const dynamic = "force-dynamic";

export default function DealsPage() {
  const liveDealsPromise = getTimeDeals("ACTIVE");
  const upcomingDealsPromise = getTimeDeals("SCHEDULED");

  // nuqs의 useQueryState가 내부에서 useSearchParams를 쓴다.
  // Suspense로 감싸지 않으면 정적 프리렌더가 실패한다.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <DealsView liveDealsPromise={liveDealsPromise} upcomingDealsPromise={upcomingDealsPromise} />
    </Suspense>
  );
}
