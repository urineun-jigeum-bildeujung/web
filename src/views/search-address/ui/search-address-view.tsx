// 주소 검색. 검색어를 받아 결과를 우리 화면에 그린다.
// UI 시안 기준(mypa_312_입력전, mypa_312, mypa_312_검색결과).
//
// 디자인팀이 화면 커스텀을 요청해 다음 우편번호 위젯을 쓰지 않는다.
// 행정안전부 도로명주소 API를 붙일 예정이며 지금은 목 데이터다. 누가 만들지는 백엔드팀 회신 대기 중.
//
// 고른 주소는 주소창에 실어 배송지 화면으로 돌려보낸다. 컴포넌트 상태로는 화면을 넘길 수 없다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { cn } from "@/shared/lib/utils";
import {
  AddressResultList,
  type AddressResult,
} from "@/shared/ui/address-result-list/address-result-list";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { Input } from "@/shared/ui/input";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";
import { Skeleton } from "@/shared/ui/skeleton";

import { ADDRESS_PAGE_SIZE } from "../api/address-search";
import { useQueryAddressSearch } from "../api/use-query-address-search";

/** 검색어를 어떻게 넣는지 보여주는 예시 (mypa_312_입력전) */
const SEARCH_EXAMPLES = [
  { label: "도로명", example: "예) 무학로 33, 도산대로 8길 23" },
  { label: "동주소", example: "예) 연희동 42-18" },
  { label: "건물명", example: "예) 역삼동 푸르지오, 텐즈힐" },
];

/** 행안부 API가 한 글자 검색어를 거절한다(E0008). 보내기 전에 우리가 먼저 막는다 */
const MIN_KEYWORD_LENGTH = 2;

export function SearchAddressView() {
  const router = useRouter();
  // 어느 배송지를 고치던 중인지. 배송지 화면이 실어 보내고 우리가 그대로 돌려준다
  const [place] = useQueryState("place");
  // 찾은 말과 몇 쪽인지는 주소창에 둔다. 새로고침과 뒤로가기에서 살아남아야 하는 값이다 (AGENTS.md 5.1).
  // 쪽은 화면 구성이 바뀌므로 history를 쌓아 뒤로가기가 앞 쪽으로 돌아가게 한다
  const [query, setQuery] = useQueryState("query", { defaultValue: "" });
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ history: "push" }),
  );
  // 입력 중인 값은 아직 찾은 것이 아니라 화면에만 둔다. 처음 값은 주소창에서 가져온다
  const [keyword, setKeyword] = useState(query);
  const [selected, setSelected] = useState<AddressResult | null>(null);

  // 뒤로가기로 주소창의 찾은 말이 바뀌면 입력칸도 따라가야 한다. 안 그러면 결과와 입력칸이 어긋난다.
  // 렌더 중에 앞 값과 견주는 것이 React가 권하는 방식이다 — effect로 하면 한 번 어긋난 채 그려진다
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setKeyword(query);
  }

  const canSearch = keyword.trim().length >= MIN_KEYWORD_LENGTH;

  // 주소창의 값으로 찾는다. 그래야 새로고침해도 같은 화면이 나온다
  const { result, error, isSearching, isRefreshing } = useQueryAddressSearch(query, page);
  const lastPage = result ? Math.max(1, Math.ceil(result.totalCount / ADDRESS_PAGE_SIZE)) : 1;
  // 주소창의 쪽이 범위를 벗어나면 조회 쪽에서 보정해 돌려준다. 화면은 보정된 값을 쓴다
  const safePage = result?.page ?? 1;

  // 보정이 일어났으면 주소창도 맞춰 둔다. 사용자가 누른 적 없는 이동이라 history를 쌓지 않는다
  useEffect(() => {
    if (result && safePage !== page) {
      void setPage(safePage, { history: "replace" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- result는 매 렌더 새 객체라 넣으면 무한 루프다
  }, [safePage, page, setPage]);

  // 쪽을 넘기거나 다시 찾으면 고른 것이 화면에서 사라진다. 그대로 두면 안 보이는 주소로 넘어간다.
  // 상태를 지우는 대신 지금 목록에 있는지로 판단해 effect 없이 끝낸다
  const selectedInPage =
    selected && result?.items.some((item) => item.roadAddr === selected.roadAddr) ? selected : null;

  const search = () => {
    if (!canSearch) {
      return;
    }
    void setQuery(keyword.trim());
    void setPage(1);
  };

  // 시안은 검색어만 넣어도 `입력 완료`를 활성으로 그렸지만, 주소를 고르지 않으면 넘길 값이 없다.
  // 골랐을 때만 활성으로 둔다 (#187).
  const submit = () => {
    if (!selectedInPage) {
      return;
    }
    // 우편번호도 함께 넘긴다. 배송지 화면은 도로명만 보여주지만(시안) 저장할 때 둘 다 필요하다 —
    // 백엔드가 `zipNo → zipCode`, `roadAddr → address`로 받기로 했다 (2026-09-15 회신).
    const query = new URLSearchParams({
      zipNo: selectedInPage.zipNo,
      roadAddr: selectedInPage.roadAddr,
    });
    // 고치던 대상을 되돌려준다. 빠뜨리면 배송지 화면이 새 배송지로 다시 서서 먼저 적어 둔 값이 날아간다
    if (place) {
      query.set("place", place);
    }
    router.push(`/mypage/address/new?${query}`);
  };

  return (
    <SingleInputScreen
      question="주소를 입력해주세요"
      submitDisabled={!selectedInPage}
      onSubmit={submit}
    >
      {/* 시안은 테두리 상자가 아니라 밑줄 한 줄이고 검색 버튼이 그 줄 안에 들어간다 */}
      <div className="flex items-center gap-2 border-b border-border px-3">
        <label htmlFor="address-keyword" className="sr-only">
          주소 검색어
        </label>
        <Input
          id="address-keyword"
          value={keyword}
          placeholder="예) 테헤란로 123"
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && search()}
          className="h-11 flex-1 border-0 px-0 text-body-medium-16 shadow-none placeholder:text-text-body-tertiary focus-visible:ring-0"
        />
        {/* 시안 button/s — 28px에 label/bold_14. 비활성은 흐려지지 않고 회색으로 채워진다 */}
        <Button
          disabled={!canSearch}
          onClick={search}
          className={cn(
            "h-7 shrink-0 rounded-lg px-3 text-label-bold-14",
            "disabled:bg-surface-disable disabled:text-text-label-disable disabled:opacity-100",
          )}
        >
          검색
        </Button>
      </div>

      {/* 어떻게 찾아야 하는지 알려주는 예시. 검색 전에만 보인다 (mypa_312_입력전) */}
      {query.length === 0 && (
        <dl className="flex flex-col gap-5">
          {SEARCH_EXAMPLES.map((item) => (
            <div key={item.label} className="flex gap-2">
              <dt className="shrink-0 text-label-bold-14 text-foreground">{item.label}</dt>
              <dd className="text-body-regular-14 text-text-body-tertiary">{item.example}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* 뼈대는 눈으로만 읽히는 표시다. 스크린 리더에는 찾는 중이라고 말로 알린다 */}
      {isSearching && (
        <div role="status" aria-live="polite">
          <span className="sr-only">주소를 찾는 중</span>
          <div aria-hidden>
            <AddressResultSkeleton />
          </div>
        </div>
      )}

      {/* 실패하면 무엇이 잘못됐는지 알려 준다. 검색어 문제면 고쳐서 다시 찾을 수 있다.
          화면을 보지 않는 사람에게도 바로 닿도록 alert로 띄운다 */}
      {error && <EmptyState role="alert" {...APP_MESSAGE[toAppMessageCode(error)]} />}

      {!isSearching &&
        !error &&
        result &&
        (result.items.length > 0 ? (
          <>
            {/* 쪽을 넘기는 동안 앞 결과를 그대로 두되, 아직 오는 중임을 흐리게 보여 준다.
                목록을 지우고 뼈대를 띄우면 넘길 때마다 화면이 들썩인다 */}
            <AddressResultList
              results={result.items}
              onSelect={setSelected}
              aria-busy={isRefreshing}
              className={cn(isRefreshing && "opacity-60 transition-opacity")}
            />
            <Pagination
              page={safePage}
              lastPage={lastPage}
              busy={isRefreshing}
              onChange={(next) => void setPage(next)}
            />
          </>
        ) : (
          <EmptyState
            title="검색 결과가 없어요"
            description="도로명이나 건물명으로 다시 찾아보세요."
          />
        ))}
    </SingleInputScreen>
  );
}

type PaginationProps = {
  page: number;
  lastPage: number;
  /** 다음 쪽이 오는 중. 누른 셰브론만 스피너로 바뀐다 */
  busy?: boolean;
  onChange: (page: number) => void;
};

/**
 * 목록 바로 아래 페이지 넘기는 줄.
 *
 * PD팀이 한 페이지 4개에 넘기는 버튼을 바로 아래 두기로 정했다(2026-09-15). 393×852에서
 * 스크롤이 생기지 않는 수다. 쪽 번호를 늘어놓지 않는 것은 `역삼동`처럼 흔한 검색어가
 * 4,747건까지 나와 쪽이 천 개가 넘기 때문이다 — 몇 쪽인지 보여 주고 검색어를 좁히게 한다.
 */
function Pagination({ page, lastPage, busy = false, onChange }: PaginationProps) {
  // 어느 쪽을 눌렀는지 기억한다. 둘 다 돌리면 어디로 가는 중인지 알 수 없다.
  // `busy`가 풀리면 아래 조건에서 무시되므로 따로 되돌릴 것이 없다
  const [pressed, setPressed] = useState<"prev" | "next">();

  // 한 쪽뿐이면 넘길 곳이 없다
  if (lastPage <= 1) {
    return null;
  }

  return (
    // mt-auto로 아래에 붙인다. 목록 바로 밑에 두면 마지막 쪽처럼 결과가 적을 때 버튼이 위로 튀어
    // 방금 누르던 자리에서 사라진다(9건 기준 345px). 순서는 목록 다음 그대로다
    <nav
      aria-label="검색 결과 페이지"
      className="mt-auto flex items-center justify-center gap-2 pt-2"
    >
      <Button
        variant="ghost"
        aria-label="이전 페이지"
        disabled={page <= 1}
        onClick={() => {
          setPressed("prev");
          onChange(page - 1);
        }}
        className="size-11 p-0 disabled:opacity-100 disabled:[&_svg]:text-icon-stroke-disable"
      >
        <LoadingSwap
          loading={busy && pressed === "prev"}
          label="이전 쪽을 불러오는 중"
          spinnerClassName="size-5"
        >
          <Icon name="left" className="size-5" />
        </LoadingSwap>
      </Button>

      <p aria-live="polite" className="min-w-16 text-center text-label-bold-14 text-foreground">
        {page}
        <span className="text-text-body-tertiary"> / {lastPage}</span>
      </p>

      <Button
        variant="ghost"
        aria-label="다음 페이지"
        disabled={page >= lastPage}
        onClick={() => {
          setPressed("next");
          onChange(page + 1);
        }}
        className="size-11 p-0 disabled:opacity-100 disabled:[&_svg]:text-icon-stroke-disable"
      >
        <LoadingSwap
          loading={busy && pressed === "next"}
          label="다음 쪽을 불러오는 중"
          spinnerClassName="size-5"
        >
          <Icon name="right" className="size-5" />
        </LoadingSwap>
      </Button>
    </nav>
  );
}

/**
 * 찾는 동안 자리를 잡아 두는 뼈대.
 *
 * 빈 화면을 두면 결과가 도착할 때 아래 버튼까지 밀려 올라간다. 시안에 로딩 화면이 따로 없어
 * 결과 한 칸과 같은 모양으로 네 칸을 잡아 둔다 — PD팀에 공용 로딩 시안을 요청해 두었다.
 */
function AddressResultSkeleton() {
  return (
    <ul className="flex flex-col gap-4">
      {Array.from({ length: ADDRESS_PAGE_SIZE }, (_, index) => (
        <li key={index} className="flex flex-col gap-2 border-b border-border pb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </li>
      ))}
    </ul>
  );
}
