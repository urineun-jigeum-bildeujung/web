// 자동완성 한 줄. 입력한 글자와 겹치는 부분을 강조해 왜 이 말이 떴는지 보인다.
// 와이어프레임 기준(검색 화면_검색어 입력중)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { IoSearchOutline } from "react-icons/io5";

type SuggestionItemProps = {
  suggestion: string;
  /** 지금 입력한 글자. 이 부분만 색이 다르다 */
  keyword: string;
  onSelect: (suggestion: string) => void;
};

/** 겹치는 부분을 [앞, 겹침, 뒤]로 나눈다. 없으면 겹침이 빈 문자열이다 */
export function splitByKeyword(suggestion: string, keyword: string) {
  const trimmed = keyword.trim();
  if (!trimmed) return { before: suggestion, match: "", after: "" };

  const at = suggestion.toLowerCase().indexOf(trimmed.toLowerCase());
  if (at === -1) return { before: suggestion, match: "", after: "" };

  return {
    before: suggestion.slice(0, at),
    // 찾은 자리의 원문을 쓴다. 입력한 대소문자로 바꿔 쓰면 추천어가 달라 보인다
    match: suggestion.slice(at, at + trimmed.length),
    after: suggestion.slice(at + trimmed.length),
  };
}

export function SuggestionItem({ suggestion, keyword, onSelect }: SuggestionItemProps) {
  const { before, match, after } = splitByKeyword(suggestion, keyword);

  return (
    <button
      type="button"
      onClick={() => onSelect(suggestion)}
      className="flex min-h-12 w-full items-center gap-3 border-b border-border px-4 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <IoSearchOutline aria-hidden className="size-5 shrink-0 text-muted-foreground" />
      {/* 강조는 색으로만 하지 않는다. 굵기를 함께 줘야 색을 구분하기 어려운 사람도 안다 */}
      <span className="truncate text-sm text-foreground">
        {before}
        {match && <strong className="font-bold text-brand">{match}</strong>}
        {after}
      </span>
    </button>
  );
}
