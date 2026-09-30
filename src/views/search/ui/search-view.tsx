// 검색 화면. 최근 검색어로 시작하고, 글자를 넣으면 추천어를 보인다.
// UI 시안 기준(#245, 2396-80473·2396-80487, 검색어 입력 1117-6366)이다.
//
// 이 화면은 제목 대신 입력창이 머리말 자리에 온다. 들어오자마자 칠 수 있어야 하는 화면이라
// 한 번 더 눌러 입력을 시작하게 만들지 않는다.

"use client";

import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { IoCloseCircle, IoSearchOutline } from "react-icons/io5";

import { BottomNav } from "@/widgets/bottom-nav";
import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon/icon";
import { Input } from "@/shared/ui/input";
import { HeaderBackButton } from "@/shared/ui/page-header/header-back-button";

import { RecentKeywordChip } from "./recent-keyword-chip";
import {
  getRecent,
  getRecentOnServer,
  pushRecent,
  setRecent,
  subscribeRecent,
} from "../model/recent-keywords";
import { SuggestionItem } from "./suggestion-item";

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

    setRecent(pushRecent(recent ?? [], trimmed));
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
    //
    // 이 화면은 `(constrained)` 그룹 밖이라 폭을 스스로 진다(#573). 1200은
    // 브레이크포인트가 아니라 최대 폭이다 — 768~1199는 뷰포트를 다 쓰고 1200부터 멈춰
    // 가운데 선다. 거터 20px은 컨테이너가 아니라 섹션이 갖는다. 시안(2656-32932·2675-33685)의
    // 768 프레임도 제목 줄이 fill이라 화면 폭을 그대로 쓴다
    <div className="mx-auto flex min-h-dvh w-full max-w-300 flex-col">
      {/* 제목 자리를 입력창이 차지한다. PageHeader는 가운데 제목을 전제로 해서 쓰지 않는다.
          뒤로가기는 모든 헤더와 같은 조각이고, 높이 48·좌우 20에 입력창이 뒤로가기 누르는 자리
          바로 옆에서 시작하는 것은 시안(1117-9724) 그대로다(#513) */}
      <header className="flex h-12 items-center px-5">
        <HeaderBackButton onClick={() => router.back()} />

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
          {/* 시안은 입력창 안쪽 12px에 24px 돋보기(icon/stroke/tertiary)다 */}
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3 size-6 -translate-y-1/2 text-icon-stroke-tertiary"
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
          // 거터 20px과 제목 줄↔칩 줄 8px은 시안(393 2396-80487, 768 2675-33685) 값이고
          // 두 폭이 같다. 헤더 아래 간격(pt-2)은 시안이 16px이지만 그중 12px이 헤더
          // 아래쪽 패딩이고, #513이 헤더를 48px로 고정하며 그 12px을 버려서 그대로 둔다
          <section className="flex flex-col gap-2 px-5 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-title-bold-16 text-foreground">최근 검색어</h2>
              {recent && recent.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecent([])}
                  // 고르러 온 화면(picking, 1117-9724)만 옅은 회색(#b1b3bb,
                  // text-body-unselect)이고, 일반 검색(2396-80487)은 #565d6d다
                  //
                  // 보이는 크기는 시안대로 두고 누르는 자리만 after:로 44px 확보한다
                  // (product-detail-view의 같은 텍스트 버튼과 같은 기법).
                  //
                  // min-h-11로 실제 상자를 키우던 동안 이 버튼이 제목 줄 높이를 44px로
                  // 밀어 올려, items-center가 24px 제목을 그 안에 가운데 두었다 — 시안이
                  // 8px인 제목 글자↔칩 줄 간격이 18px이 됐다.
                  //
                  // 세로 11px씩은 22px 줄을 44px로 만들고, 가로 4px씩은 걷어낸 px-1
                  // 자리를 그대로 대신해 탭 영역 폭(64px)이 전과 같다. 글자는 시안대로
                  // 거터 20px에 붙는다. 정렬 드롭다운처럼 가로도 11px씩 넓히지는 않는다 —
                  // 옆 요소와 탭 영역이 겹칠 수 있다(#265)
                  className={cn(
                    "relative flex items-center text-label-medium-14 after:absolute after:-inset-x-1 after:-inset-y-2.75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    picking ? "text-text-body-unselect" : "text-text-body-secondary",
                  )}
                >
                  전체삭제
                </button>
              )}
            </div>

            {/* 붙기 전에는 저장된 것을 아직 모른다(`null`). 빈 상태를 먼저 그리면 저장된 검색어가
                있는 사람에게 "내역이 없어요"가 잠깐 떴다 사라진다 (#479) */}
            {recent !== null &&
              (recent.length > 0 ? (
                // 시안의 칩 줄은 gap "12px 8px"이고 높이 92px = 40+12+40이 두 줄과 세로
                // 12px을 함께 확인해 준다. 768 프레임(2675:33697)만 폭이 fixed 393px인데,
                // 바로 위 제목 줄과 393 프레임의 같은 줄이 모두 fill이라 복사 자국으로 보고
                // 넓은 폭에서도 흐르게 둔다
                <ul className="flex flex-wrap gap-x-2 gap-y-3">
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
              ))}
          </section>
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
