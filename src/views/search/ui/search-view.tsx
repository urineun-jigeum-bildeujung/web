// 검색 화면. 최근 검색어와 카테고리 바로가기로 시작하고, 글자를 넣으면 추천어를 보인다.
// 와이어프레임 기준(검색 화면_검색 전, 검색어 입력중 ×2, 최근 검색어 없음)이라
// 디자인 확정 시 바뀔 수 있다.
//
// 이 화면은 제목 대신 입력창이 머리말 자리에 온다. 들어오자마자 칠 수 있어야 하는 화면이라
// 한 번 더 눌러 입력을 시작하게 만들지 않는다.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoChevronBack, IoCloseCircle, IoSearchOutline } from "react-icons/io5";

import { BottomNav } from "@/widgets/bottom-nav";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Input } from "@/shared/ui/input";

import { RecentKeywordChip } from "./recent-keyword-chip";
import { SuggestionItem } from "./suggestion-item";

const CATEGORIES = [
  { value: "food", label: "사료", emoji: "🦴" },
  { value: "snack", label: "간식", emoji: "🍖" },
  { value: "supplement", label: "영양제", emoji: "💊" },
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

const INITIAL_RECENT = ["저자극 덴탈껌", "중소형견 사료", "사료", "고양이 화장실 모래", "양치 껌"];

export function SearchView() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [keyword, setKeyword] = useState("");
  const [recent, setRecent] = useState<string[]>(INITIAL_RECENT);

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

    setRecent((prev) => [trimmed, ...prev.filter((item) => item !== trimmed)]);
    // 검색 결과 화면 시안이 아직 없다. 종류별 목록으로 보내 막다른 길을 만들지 않는다
    router.push("/?category=food");
  };

  return (
    <div className="flex min-h-dvh flex-col pb-16">
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
            className="rounded-full px-10"
          />
          {typing && (
            <button
              type="button"
              aria-label="입력 지우기"
              onClick={() => {
                setKeyword("");
                inputRef.current?.focus();
              }}
              className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
                <h2 className="text-sm font-medium text-foreground">최근 검색어</h2>
                {recent.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRecent([])}
                    className="min-h-9 px-1 text-xs text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
                        onRemove={(word) =>
                          setRecent((prev) => prev.filter((entry) => entry !== word))
                        }
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<IoSearchOutline />}
                  title="최근에 검색한 내역이 없어요"
                  description="궁금한 상품을 검색해보세요"
                  className="py-10"
                />
              )}
            </section>

            <section className="flex flex-col gap-3 px-4 pt-6">
              <h2 className="text-sm font-medium text-foreground">카테고리로 둘러보기</h2>
              <ul className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <li key={category.value}>
                    <Link
                      href={`/?category=${category.value}`}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <span aria-hidden>{category.emoji}</span>
                      {category.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
