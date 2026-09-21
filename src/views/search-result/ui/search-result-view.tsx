// 검색 결과 화면. 검색어에 걸린 상품을 2열로 보이고 정렬을 고를 수 있다.
// UI 시안 기준(#245, 2396-80432, 고르기 1117-6424)이다.
//
// 검색 입력 화면과 나눠 둔 이유는 머리말 동작이 반대라서다. 입력 화면은 들어오자마자
// 칠 수 있어야 하고, 결과 화면의 검색바는 누르면 입력 화면으로 되돌아가는 버튼이다.
//
// 목록은 서버가 조회해 준다(#282). `/app/search/result/page.tsx`가 만든 Promise를
// `resultsPromise`로 받아 `use()`로 푼다 — 헤더·검색바·제목은 그 결과를 기다리지 않고
// 바로 그려지고, 결과 개수·정렬·목록·빈 상태만 한 덩어리로 묶여 대기한다.

"use client";

import { Suspense, use, useState } from "react";
import { useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { IoChevronBack, IoSearchOutline } from "react-icons/io5";

import type { ProductCard, ProductSearchResult } from "@/entities/product";
import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon/icon";
import { formatWon } from "@/shared/ui/price/price";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { BottomNav } from "@/widgets/bottom-nav";

import { SORT_LABEL, SORTS, type ResultSort } from "../model/sort";

/** 결과가 없을 때. 시안(2022-157694)이 공용 EmptyState(72px+18px 굵은 제목)와 달리
 *  굵기 구분 없는 16px 문단 한 덩어리라 여기서 따로 그린다 */
function NoResults() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center text-text-body-tertiary">
      <Icon name="search" aria-hidden className="size-18" />
      <p className="text-body-medium-16">
        검색 결과가 없어요
        <br />
        단어의 철자가 맞는지 확인하거나
        <br />
        다른 검색어로 다시 찾아보세요
      </p>
    </div>
  );
}

type GeneralResultListProps = {
  results: ProductCard[];
  totalCount: number;
  sort: ResultSort;
  onSortChange: (sort: ResultSort) => void;
  liked: string[];
  onToggleLike: (id: string) => void;
};

/** 그냥 검색하러 왔을 때. 총 개수·정렬·할인율·별점·찜하기가 있다(2396-80432) */
function GeneralResultList({
  results,
  totalCount,
  sort,
  onSortChange,
  liked,
  onToggleLike,
}: GeneralResultListProps) {
  return (
    // 총 개수·정렬 줄과 격자 사이 12px은 시안(2396-80432, top 149→185)과 맞다.
    // 제목과 이 줄 사이 6px은 SearchResultView의 <h1> 쪽에서 맞춘다
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-label-medium-14 text-text-body-secondary">총 {totalCount}개</p>
        {/* home-view의 정렬 드롭다운(1758-69100)과 같은 조합이다 — 트리거 글자 크기(22px)에
            after:로 44px 탭 영역만 넓히고, 패널은 고른 항목을 체크 아이콘 대신
            배경색(bg-surface-weak)으로만 구분한다 */}
        <Select value={sort} onValueChange={(next) => onSortChange(next as ResultSort)}>
          <SelectTrigger
            aria-label="정렬"
            className="relative w-auto border-0 bg-transparent p-0 text-label-bold-14 text-text-body-secondary shadow-none after:absolute after:-inset-2.75 data-[size=default]:h-auto dark:bg-transparent dark:hover:bg-transparent"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end" className="w-42.5 min-w-42.5 p-1">
            {SORTS.map((value) => (
              <SelectItem
                key={value}
                value={value}
                className="h-10 rounded-md px-1.5 text-label-medium-14 data-[state=checked]:bg-surface-weak data-[state=checked]:font-bold [&>span:first-child]:hidden"
              >
                {SORT_LABEL[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
        {results.map((product) => {
          const id = String(product.productId);
          return (
            <li key={id}>
              <ProductGridCard
                href={`/products/${id}`}
                name={product.name}
                price={product.price}
                imageUrl={product.thumbnailUrl ?? undefined}
                // 시안(2396-80432·2396-80461)은 사진 위에 바로 얹지 않고 어두운 원판(32px)
                // 안에 24px 흰 하트를 놓는다. 원판은 이미지 모서리에서 4px 떨어져 있다
                // (공용 기본값 top-3/right-3=12px보다 좁아 이 화면만 덮어쓴다). 44px 안팎
                // 감싸는 버튼을 따로 두면 원판이 가운데 정렬되며 안쪽으로 밀려 4px이
                // 아니게 되므로, 원판 자체를 버튼으로 쓰고 after:로 탭 영역만 44px로
                // 넓힌다(32+6*2=44) — home-view 텍스트 버튼과 같은 기법이다
                imageActionClassName="top-1 right-1"
                imageAction={
                  <button
                    type="button"
                    onClick={() => onToggleLike(id)}
                    aria-pressed={liked.includes(id)}
                    aria-label={`${product.name} 찜하기`}
                    className="relative flex size-8 items-center justify-center rounded-full bg-surface-overlay-dimmed text-icon-fill-static-white after:absolute after:-inset-1.5"
                  >
                    {liked.includes(id) ? (
                      <Icon name="heart_fill" aria-hidden className="size-6" />
                    ) : (
                      <Icon name="heart_stroke" aria-hidden className="size-6" />
                    )}
                  </button>
                }
                meta={
                  <>
                    <p className="text-xs text-muted-foreground">
                      {product.unitLabel} {formatWon(product.unitPrice)}
                    </p>
                    {/* 시안은 5개 별점 줄이 아니라 별 1개(16px)+숫자다 — 공용 Rating은
                        review-card처럼 실제 5개 별점을 보이는 화면 전용이라 여기 안 맞는다.
                        별 색은 Rating과 같은 text-icon-fill-accent(노랑) 토큰이다 */}
                    <span className="flex items-center gap-2">
                      <span className="sr-only">{`5점 만점에 ${product.rating}점`}</span>
                      <span aria-hidden className="flex items-center gap-0.5">
                        <Icon name="star" className="size-4 text-icon-fill-accent" />
                        <span className="text-label-medium-14 text-text-body-tertiary">
                          {product.rating}
                        </span>
                      </span>
                      <span aria-hidden className="text-label-medium-14 text-text-body-tertiary">
                        후기 {product.reviewCount}
                      </span>
                      <span className="sr-only">{`후기 ${product.reviewCount}개`}</span>
                    </span>
                  </>
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type PickingResultListProps = {
  results: ProductCard[];
  picked: string | null;
  onPick: (id: string) => void;
};

/** 비교 자리를 채우러 왔을 때. 시안(1117-6424)은 총 개수·정렬 없이 체크박스와
 *  이름·가격만 있다 — 무엇이 더 맞는지·싼지가 아니라 고르는 것 자체가 목적이다 */
function PickingResultList({ results, picked, onPick }: PickingResultListProps) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
      {results.map((product) => {
        const id = String(product.productId);
        return (
          <li key={id}>
            <ProductGridCard
              selectable
              selected={picked === id}
              onSelect={() => onPick(id)}
              name={product.name}
              price={product.price}
              priceClassName="text-title-bold-16"
            />
          </li>
        );
      })}
    </ul>
  );
}

type ResultsRegionProps = {
  resultsPromise: Promise<ProductSearchResult>;
  alreadyPicked: string | null;
  picking: boolean;
  picked: string | null;
  onPick: (id: string) => void;
  sort: ResultSort;
  onSortChange: (sort: ResultSort) => void;
  liked: string[];
  onToggleLike: (id: string) => void;
};

/** 결과 개수·정렬·목록·빈 상태를 한 덩어리로 묶는다. `use()`가 미결 상태인 동안
 *  바깥의 Suspense가 이 자리만 ResultsSkeleton으로 가린다 */
function ResultsRegion({
  resultsPromise,
  alreadyPicked,
  picking,
  picked,
  onPick,
  sort,
  onSortChange,
  liked,
  onToggleLike,
}: ResultsRegionProps) {
  const { items, totalCount } = use(resultsPromise);
  // 반대쪽 자리에 이미 있는 상품은 고르는 목록에서 뺀다(#245) — key 충돌 방지
  const results = items.filter((item) => String(item.productId) !== alreadyPicked);

  if (results.length === 0) {
    return <NoResults />;
  }
  if (picking) {
    return <PickingResultList results={results} picked={picked} onPick={onPick} />;
  }
  return (
    <GeneralResultList
      results={results}
      totalCount={totalCount}
      sort={sort}
      onSortChange={onSortChange}
      liked={liked}
      onToggleLike={onToggleLike}
    />
  );
}

/** 결과 영역이 대기 중일 때 자리를 잡는다. 개수+정렬 줄 하나, 카드 자리 8장 */
function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="검색 결과를 불러오는 중">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-14" />
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index} className="flex flex-col gap-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  );
}

type SearchResultViewProps = {
  /** `app/search/result/page.tsx`가 서버에서 만든, 아직 안 기다린 조회 결과 */
  resultsPromise: Promise<ProductSearchResult>;
};

export function SearchResultView({ resultsPromise }: SearchResultViewProps) {
  const router = useRouter();

  const [keyword] = useQueryState("q", parseAsString.withDefault(""));
  // 비교 화면이 자리를 채우러 보냈으면 그 자리 번호가 담겨 온다.
  // 그때는 카드를 눌러도 이동하지 않고 체크만 되고, 아래 "선택 완료"로 확정한다
  const [slot] = useQueryState("slot");
  const [from] = useQueryState("from");
  const [first] = useQueryState("first");
  // 반대쪽 자리에 이미 있던 상품 id. 비교 화면으로 돌아갈 때 그 자리를 되살리는 데 쓴다
  const [other] = useQueryState("other");
  const picking = slot !== null;
  const [picked, setPicked] = useState<string | null>(null);
  const [liked, setLiked] = useState<string[]>([]);
  const toggleLike = (id: string) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  const otherContext = slot !== null && other ? `&other=${encodeURIComponent(other)}` : "";
  const detailContext =
    slot !== null && from === "detail" && first
      ? `&from=detail&first=${encodeURIComponent(first)}`
      : "";
  // 정렬은 같은 목록을 좁히는 것이라 히스토리에 쌓지 않는다(기본 replace).
  // shallow는 nuqs 기본값(true)을 꺼서(false) 서버 컴포넌트가 새 정렬로 다시 조회하게 한다
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORTS).withDefault("recommend").withOptions({ shallow: false }),
  );

  // 이미 반대쪽 자리에 있는 상품이다. 고르는 화면(picking)에서 이 상품을 또
  // 고르면 두 자리의 id가 겹쳐 React key 충돌이 난다(#245) — 목록에서 아예 뺀다
  const alreadyPicked = !picking
    ? null
    : other && other !== "none"
      ? other
      : from === "detail"
        ? first
        : null;

  return (
    // BottomNav는 sticky라 콘텐츠를 밀어내며 자리 잡는다. fixed 오버레이가 아니라서
    // 가릴 콘텐츠가 없고, 그래서 하단에 별도 여백(pb)이 필요 없다 — 넣으면 네브 아래
    // 빈 공간만 생긴다
    <div className="flex min-h-dvh flex-col">
      {/* 제목 자리를 검색바가 차지한다. PageHeader는 가운데 제목을 전제로 해서 쓰지 않는다 */}
      <header className="flex h-14 items-center gap-1 px-2">
        <button
          type="button"
          aria-label="뒤로"
          onClick={() => router.back()}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <IoChevronBack aria-hidden className="size-6" />
        </button>

        {/* 입력창처럼 보이지만 버튼이다. 여기서 고쳐 치는 게 아니라 검색 화면으로 되돌아간다 */}
        <button
          type="button"
          onClick={() =>
            router.push(
              slot
                ? `/search?slot=${encodeURIComponent(slot)}${otherContext}${detailContext}`
                : "/search",
            )
          }
          // 시안(2396-80432 등)은 알약 모양이 아니라 8px 모서리에 옅은 회색(#eeeff1) 채움이다
          className="flex min-h-11 flex-1 items-center gap-2 rounded-lg bg-secondary px-3 text-left transition-colors hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <IoSearchOutline aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-foreground">{keyword}</span>
          <span className="sr-only">검색어 고치기</span>
        </button>
      </header>

      <main className="flex flex-1 flex-col px-4 pt-2 pb-4">
        {/* 결과 영역이 서버 조회를 기다리는 동안엔 개수를 몰라 6px/12px 간격을 못 가른다.
            픽킹 모드가 아니면 우선 좁은 간격(6px)으로 둔다 — 결과 없음일 때만 약간 더
            벌어져 보일 수 있는 정도라 이번 단계에서는 감수한다 */}
        <h1 className={cn("text-base font-bold text-foreground", !picking ? "mb-1.5" : "mb-3")}>
          검색 결과
        </h1>

        <Suspense fallback={<ResultsSkeleton />}>
          <ResultsRegion
            resultsPromise={resultsPromise}
            alreadyPicked={alreadyPicked}
            picking={picking}
            picked={picked}
            onPick={(id) => setPicked((prev) => (prev === id ? null : id))}
            sort={sort}
            onSortChange={(next) => void setSort(next)}
            liked={liked}
            onToggleLike={toggleLike}
          />
        </Suspense>
      </main>

      {picking ? (
        <BottomActionBar>
          <Button
            disabled={!picked}
            onClick={() => {
              if (!picked) return;
              router.push(
                `/compare?slot=${encodeURIComponent(slot)}&product=${picked}${otherContext}${detailContext}`,
              );
            }}
          >
            선택 완료
          </Button>
        </BottomActionBar>
      ) : (
        <BottomNav />
      )}
    </div>
  );
}
