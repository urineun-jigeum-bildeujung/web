// 검색 화면. 최근 검색어와 카테고리 바로가기로 시작하고, 글자를 넣으면 추천어를 보인다.
// UI 시안 기준(#245, 2396-80473·2396-80487, 검색어 입력 1117-6366)이다.
//
// 이 화면은 제목 대신 입력창이 머리말 자리에 온다. 들어오자마자 칠 수 있어야 하는 화면이라
// 한 번 더 눌러 입력을 시작하게 만들지 않는다.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { IoChevronBack, IoCloseCircle, IoSearchOutline } from "react-icons/io5";

import { BottomNav } from "@/widgets/bottom-nav";
import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { RecentKeywordChip } from "./recent-keyword-chip";
import {
  getRecent,
  getRecentOnServer,
  pushRecent,
  setRecent,
  subscribeRecent,
} from "../model/recent-keywords";
import { SuggestionItem } from "./suggestion-item";

// 시안(2396-80487)은 칩에 아이콘 없이 글자만 있다
const CATEGORIES = [
  { value: "food", label: "사료" },
  { value: "snack", label: "간식" },
  { value: "supplement", label: "영양제" },
] as const;

// 목 데이터. 실제로는 무엇을 추천할지 기획 확정 후 서버에서 받는다
const SUGGESTIONS = [
  "중소형견 사료",
  "중소형견 소포장 사료",
  "중소형견 관절 영양제",
  "저자극 덴탈껌",
  "고양이 화장실 모래",
  "노령견 저지방 사료",
  "닭가슴살 트릿",
  "양치 껌",
];

export function SearchView() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // 비교 화면이 자리를 채우러 보냈으면 그 자리 번호가 담겨 온다. 결과 화면까지 들고 간다
  const [slot] = useQueryState("slot");
  const [from] = useQueryState("from");
  const [first] = useQueryState("first");
  // 반대쪽 자리에 이미 있던 상품 id. 비교 화면으로 돌아갈 때 그 자리를 되살리는 데 쓴다
  const [other] = useQueryState("other");
  const [keyword, setKeyword] = useState("");
  // 저장소는 React 밖의 것이라 효과로 되읽지 않고 여기서 구독한다
  const recent = useSyncExternalStore(subscribeRecent, getRecent, getRecentOnServer);

  // 검색하러 온 화면이라 바로 칠 수 있어야 한다
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const typing = keyword.trim().length > 0;
  const matched = typing
    ? SUGGESTIONS.filter((item) => item.toLowerCase().includes(keyword.trim().toLowerCase()))
    : [];

  /** 검색한 말은 최근 검색어 맨 앞으로 올린다. 같은 말을 두 번 남기지 않는다 */
  const search = (word: string) => {
    const trimmed = word.trim();
    if (!trimmed) return;

    setRecent(pushRecent(recent, trimmed));
    // 종류 목록이 아니라 검색 결과 화면으로 보낸다. 어느 종류인지 알 수 없는 말을
    // 특정 카테고리로 보내면 "양치 껌"을 검색해도 사료 목록이 뜬다
    const forSlot = slot ? `&slot=${encodeURIComponent(slot)}` : "";
    const otherContext = slot !== null && other ? `&other=${encodeURIComponent(other)}` : "";
    const detailContext =
      slot !== null && from === "detail" && first
        ? `&from=detail&first=${encodeURIComponent(first)}`
        : "";
    router.push(
      `/search/result?q=${encodeURIComponent(trimmed)}${forSlot}${otherContext}${detailContext}`,
    );
  };

  const picking = slot !== null;

  return (
    // BottomNav는 sticky라 콘텐츠를 밀어내며 자리 잡는다. fixed 오버레이가 아니라서
    // 가릴 콘텐츠가 없고, 그래서 하단에 별도 여백(pb)이 필요 없다 — 넣으면 네브 아래
    // 빈 공간만 생긴다
    <div className="flex min-h-dvh flex-col">
      {/* 제목 자리를 입력창이 차지한다. PageHeader는 가운데 제목을 전제로 해서 쓰지 않는다 */}
      <header className="flex h-14 items-center gap-1 px-2">
        <button
          type="button"
          aria-label="이전 화면으로"
          onClick={() => router.back()}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <IoChevronBack aria-hidden className="size-6" />
        </button>

        <form
          role="search"
          className="relative flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            search(keyword);
          }}
        >
          <label htmlFor="search-keyword" className="sr-only">
            상품 검색
          </label>
          <IoSearchOutline
            aria-hidden
            className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="search-keyword"
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="상품을 검색해보세요"
            // 시안(1117-9724·1117-6366)은 알약 모양이 아니라 8px 모서리에 옅은 회색(#eeeff1)
            // 채움이고, 클릭·입력 중에도 테두리는 생기지 않는다. 다만 키보드 포커스
            // 표시 자체를 없애면 안 되므로(코드래빗 지적) 테두리 대신 링으로 표시한다
            className="h-11 rounded-lg border-0 bg-secondary px-10 focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-ring"
          />
          {typing && (
            <button
              type="button"
              aria-label="입력 지우기"
              onClick={() => {
                setKeyword("");
                inputRef.current?.focus();
              }}
              className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <IoCloseCircle aria-hidden className="size-5" />
            </button>
          )}
        </form>
      </header>

      <main className="flex flex-1 flex-col">
        {typing ? (
          // 글자를 넣으면 최근 검색어 대신 추천어가 자리를 넘겨받는다
          <ul aria-label="추천 검색어">
            {matched.map((item) => (
              <li key={item}>
                <SuggestionItem suggestion={item} keyword={keyword} onSelect={search} />
              </li>
            ))}
          </ul>
        ) : (
          <>
            <section className="flex flex-col gap-3 px-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-title-bold-16 text-foreground">최근 검색어</h2>
                {recent.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRecent([])}
                    // 시안(2396-80487)은 고르러 온 화면(picking)일 때만 옅은 회색(#b1b3bb,
                    // text-body-unselect)이고, 일반 검색(1117-9724)은 #565d6d다
                    className={cn(
                      "flex min-h-11 min-w-11 items-center justify-center px-1 text-label-medium-14 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      picking ? "text-text-body-unselect" : "text-text-body-secondary",
                    )}
                  >
                    전체삭제
                  </button>
                )}
              </div>

              {recent.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {recent.map((item) => (
                    <li key={item}>
                      <RecentKeywordChip
                        keyword={item}
                        onSearch={search}
                        onRemove={(word) => setRecent(recent.filter((entry) => entry !== word))}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                // 공용 EmptyState는 72px 아이콘·18px 제목 시안(메인 타임딜) 기준이라 여기(40px
                // 아이콘, 14px 두 줄, 2396-80473)와 맞지 않아 따로 그린다
                <div className="flex flex-col items-center gap-2 py-9 text-center text-icon-fill-tertiary">
                  <IoSearchOutline aria-hidden className="size-10" />
                  <p className="text-label-medium-14">
                    최근에 검색한 내역이 없어요
                    <br />
                    궁금한 상품을 검색해보세요
                  </p>
                </div>
              )}
            </section>

            {/* 비교 자리를 채우러 왔을 때는 시안(1117-9724)에 이 섹션이 없다 — 카테고리를
                둘러보다 다른 상품에 눈을 돌리게 하는 대신 검색으로만 좁혀 들어오게 한다 */}
            {!picking && (
              <section className="flex flex-col gap-3 px-4 pt-6">
                <h2 className="text-title-bold-16 text-foreground">카테고리로 둘러보기</h2>
                <ul className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <li key={category.value}>
                      <Link
                        href={`/?category=${category.value}`}
                        // 시안(2396-80487)의 칩은 보이는 높이가 40px이다. 누르는 자리는
                        // home-view와 같은 after: 기법으로 44px을 지킨다
                        className="relative inline-flex h-10 items-center rounded-full border border-border px-3 text-sm text-foreground transition-colors after:absolute after:inset-x-0 after:-inset-y-0.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {category.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>

      {picking ? (
        // 결과가 없는 이 화면에서는 고를 것이 없어 늘 비활성이다. 결과 화면에서 고르면 눌린다
        <BottomActionBar>
          <Button disabled>선택 완료</Button>
        </BottomActionBar>
      ) : (
        <BottomNav />
      )}
    </div>
  );
}
