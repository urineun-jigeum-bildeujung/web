// 최근 검색어 한 칩. 누르면 그 말로 다시 검색하고, ×를 누르면 목록에서 지운다.
// 와이어프레임 기준(검색 화면_검색 전)이라 디자인 확정 시 바뀔 수 있다.
//
// 버튼을 겹쳐 두지 않고 나란히 놓는다. 칩 안에 버튼을 넣으면 눌리지 않고,
// 두 동작의 탭 영역이 겹치면 지우려다 검색되는 일이 생긴다.

"use client";

import { Icon } from "@/shared/ui/icon/icon";

type RecentKeywordChipProps = {
  keyword: string;
  onSearch: (keyword: string) => void;
  onRemove: (keyword: string) => void;
};

export function RecentKeywordChip({ keyword, onSearch, onRemove }: RecentKeywordChipProps) {
  return (
    // 시안(2396-80487)의 칩은 보이는 높이가 40px, X 아이콘은 24px이다. 누르는 자리는
    // home-view와 같은 after: 기법으로 44px을 지킨다
    <span className="relative inline-flex h-10 items-center rounded-full border border-border bg-background">
      <button
        type="button"
        onClick={() => onSearch(keyword)}
        // 세로(h-10→44px)와 같은 계산으로 가로도 넓힌다. 이 버튼은 글자 길이만큼
        // 넓어 44px는 보통 넘지만, 짧은 검색어에서도 기준을 지키려고 똑같이 둔다
        className="relative flex h-full items-center rounded-l-full pr-1 pl-3 text-sm whitespace-nowrap text-foreground after:absolute after:-inset-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {keyword}
      </button>
      <button
        type="button"
        aria-label={`${keyword} 검색 기록 지우기`}
        onClick={() => onRemove(keyword)}
        // 실제 박스 폭이 4(pl)+24(아이콘)+12(pr)=40px라 세로처럼 가로도 2px씩
        // 넓혀야 44px 탭 기준을 채운다 — inset-x-0이면 세로만 늘고 가로는 40px에 머문다
        className="relative flex h-full shrink-0 items-center justify-center rounded-r-full pr-3 pl-1 text-muted-foreground after:absolute after:-inset-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Icon name="cancel" aria-hidden className="size-6" />
      </button>
    </span>
  );
}
