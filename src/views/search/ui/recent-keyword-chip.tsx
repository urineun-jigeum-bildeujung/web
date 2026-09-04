// 최근 검색어 한 칩. 누르면 그 말로 다시 검색하고, ×를 누르면 목록에서 지운다.
// 와이어프레임 기준(검색 화면_검색 전)이라 디자인 확정 시 바뀔 수 있다.
//
// 버튼을 겹쳐 두지 않고 나란히 놓는다. 칩 안에 버튼을 넣으면 눌리지 않고,
// 두 동작의 탭 영역이 겹치면 지우려다 검색되는 일이 생긴다.

"use client";

import { IoClose } from "react-icons/io5";

type RecentKeywordChipProps = {
  keyword: string;
  onSearch: (keyword: string) => void;
  onRemove: (keyword: string) => void;
};

export function RecentKeywordChip({ keyword, onSearch, onRemove }: RecentKeywordChipProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-background">
      <button
        type="button"
        onClick={() => onSearch(keyword)}
        className="min-h-11 rounded-l-full py-1.5 pr-1 pl-3 text-sm whitespace-nowrap text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {keyword}
      </button>
      <button
        type="button"
        aria-label={`${keyword} 검색 기록 지우기`}
        onClick={() => onRemove(keyword)}
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-r-full py-1.5 pr-3 pl-1 text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <IoClose aria-hidden className="size-4" />
      </button>
    </span>
  );
}
