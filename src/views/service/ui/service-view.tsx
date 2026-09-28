// 서비스 안내. 서비스 이용약관과 개인정보 처리방침으로 가는 입구다.
// 시안이 아직 없어(#209) 기능정의서(마이페이지 ver0.5 "서비스 안내")의 두 버튼을 고객지원(mypa_071)의
// 입구 줄과 같은 모양으로 둔다 (#502).

import { ListRowLink } from "@/shared/ui/list-row/list-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";

/** 고객지원 입구 줄과 같다. ListRow md에서 좌우 여백만 20으로 덮는다 */
const ENTRY_ROW = "px-5";

export function ServiceView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="서비스 안내" />

      <main className="flex flex-1 flex-col pt-4 pb-8">
        <nav aria-label="서비스 안내" className="flex flex-col gap-1">
          <ListRowLink
            href="/mypage/service/terms"
            title={<span className="text-label-bold-14">서비스 이용약관</span>}
            className={ENTRY_ROW}
          />
          <ListRowLink
            href="/mypage/service/privacy"
            title={<span className="text-label-bold-14">개인정보 처리방침</span>}
            className={ENTRY_ROW}
          />
        </nav>
      </main>
    </div>
  );
}
