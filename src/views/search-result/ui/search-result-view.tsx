// 검색 결과 화면. 검색어에 걸린 상품을 2열로 보이고 정렬을 고를 수 있다.
// UI 시안 기준(#245, 2396-80432, 고르기 1117-6424)이다.
//
// 검색 입력 화면과 나눠 둔 이유는 머리말 동작이 반대라서다. 입력 화면은 들어오자마자
// 칠 수 있어야 하고, 결과 화면의 검색바는 누르면 입력 화면으로 되돌아가는 버튼이다.
//
// 목록은 서버가 조회해 준다(#282). `/app/search/result/page.tsx`가 만든 Promise를
// `resultsPromise`로 받아 `use()`로 푼다 — 헤더·검색바·제목은 그 결과를 기다리지 않고
// 바로 그려지고, 결과 개수·정렬·목록·빈 상태만 한 덩어리로 묶여 대기한다.
// 첫 쪽 뒤는 목록 끝에 닿을 때마다 브라우저가 이어 받는다 — "총 N개"만큼 볼 수 있어야 한다(#532).

"use client";

import { Suspense, use, useState } from "react";
import { useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";

import {
  CardHeartButton,
  toWishlistItem,
  useToggleWishlist,
  useWishedProductIds,
} from "@/features/toggle-wishlist";
import {
  formatUnitPrice,
  useProductSearch,
  type ProductCard,
  type ProductSearchResult,
  type ProductSort,
} from "@/entities/product";
import { useRequireSession } from "@/shared/api/use-require-session";
import { useLoadMore } from "@/shared/lib/list/use-load-more";
import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { HeaderBackButton } from "@/shared/ui/page-header/header-back-button";
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
  /** 찜한 상품 번호. 전체 찜 목록에서 온다 (#483) */
  wishedIds: Set<number>;
  /** 찜 목록을 받는 중. 하트를 막고 대기를 보인다 (#493 리뷰) */
  wishLoading: boolean;
  onToggleLike: (product: ProductCard) => void;
};

/** 그냥 검색하러 왔을 때. 총 개수·정렬·할인율·별점·찜하기가 있다(2396-80432) */
function GeneralResultList({
  results,
  totalCount,
  sort,
  onSortChange,
  wishedIds,
  wishLoading,
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

      {/* **전환점을 잡지 않는다**(#573). PD 확정이 카드 170px 고정·사이 13px이고, 폭이
          넓어지면 카드가 커지는 것이 아니라 한 줄에 더 들어간다. 거터 20px(px-5)을 빼면
          393에서 둘(170×2+13=353), 768에서 넷(170×4+13×3=719), 1200부터 여섯(170×6+13×5=1085)이
          저절로 나와 `md:`·`lg:`가 필요 없다 — 홈 격자(#569)와 같은 계산이다.
          세로 24px인 홈과 달리 여기는 시안(2396-80432) 값인 20px(gap-y-5)을 유지한다 */}
      <ul className="flex flex-wrap gap-x-3.25 gap-y-5">
        {results.map((product) => {
          const id = String(product.productId);
          return (
            <li key={id} className="w-42.5">
              <ProductGridCard
                // 카드가 폭과 무관하게 170px이라 이미지 후보도 하나면 된다(#573)
                imageSizes="170px"
                href={`/products/${id}`}
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice ?? undefined}
                discountRate={product.discountRate}
                imageUrl={product.thumbnailUrl ?? undefined}
                // 시안(2396-80432·2396-80461)의 원판은 이미지 모서리에서 4px 떨어져 있다
                // (공용 기본값 top-3/right-3=12px보다 좁아 이 화면만 덮어쓴다). 모양은 함께 보면
                // 좋은 상품과 같아 CardHeartButton 한 벌을 쓴다
                imageActionClassName="top-1 right-1"
                imageAction={
                  <CardHeartButton
                    name={product.name}
                    wished={wishedIds.has(product.productId)}
                    loading={wishLoading}
                    onToggle={() => onToggleLike(product)}
                  />
                }
                meta={
                  <>
                    <p className="text-xs text-muted-foreground">
                      {formatUnitPrice(product.unitLabel, product.unitPrice)}
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
                      <span className="text-label-medium-14 text-text-body-tertiary">
                        후기 {product.reviewCount}개
                      </span>
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

/** 비교 자리를 채우러 왔을 때. 시안(1117-6424)에 따라 이미지·이름·가격과 선택 상태만
 *  보인다 — 무엇이 더 맞는지·싼지 견주는 목록이 아니라 고르는 흐름이라 총 개수·정렬·
 *  별점·후기는 생략한다. 시안에 있는 하루 예상 급여비는 아이마다 달라지는 값이라
 *  상품 응답(`ProductCard`)에 없어 함께 그리지 못한다 */
function PickingResultList({ results, picked, onPick }: PickingResultListProps) {
  return (
    // 일반 검색 결과와 같은 규칙으로 눕는다(#573). 비교 고르기 시안의 1199 프레임
    // (3741:71939)만 콘텐츠가 768로 고정돼 보이지만, 768~1199를 전체 폭으로 흘리는
    // 홈·상세 규칙을 그대로 따른다
    <ul className="flex flex-wrap gap-x-3.25 gap-y-5">
      {results.map((product) => {
        const id = String(product.productId);
        return (
          <li key={id} className="w-42.5">
            <ProductGridCard
              selectable
              selected={picked === id}
              onSelect={() => onPick(id)}
              // 일반 검색 결과와 같은 고정 폭이다(#573). 넘기지 않으면 공용 기본값
              // `(min-width: 768px) 240px, 50vw`가 실제 170px보다 큰 후보를 고른다
              imageSizes="170px"
              imageUrl={product.thumbnailUrl ?? undefined}
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

type NextPageFooterProps = {
  hasNext: boolean;
  loading: boolean;
  /** 다음 쪽만 실패한 경우. 이미 받은 상품은 그대로 둔다 */
  failed: boolean;
  onLoadMore: () => void;
};

/** 목록 맨 아래. 끝이 보이면 다음 쪽을 부르고, 받는 동안 카드 자리를, 다음 쪽만 실패하면
 *  다시 시도를 보인다. 시안(2396-80432)에 더 보기 버튼 자리가 없어 주문·후기 목록처럼 스크롤로 잇는다 */
function NextPageFooter({ hasNext, loading, failed, onLoadMore }: NextPageFooterProps) {
  // 가져오는 중이거나 방금 실패했으면 멈춘다 — 실패한 채로 계속 보고 있으면 같은 요청이 끝없이 다시 나간다
  const loadMoreRef = useLoadMore(onLoadMore, hasNext && !loading && !failed);

  return (
    <>
      {/* 이 줄이 화면에 들어오면 다음 쪽을 부른다. 보이는 것은 없어 높이만 1px이다 */}
      {hasNext && !failed && <div ref={loadMoreRef} aria-hidden className="h-px" />}
      {loading && (
        <div role="status" aria-label="상품을 더 불러오는 중" className="pt-5">
          <SkeletonCards count={2} />
        </div>
      )}

      {/* 다음 쪽만 실패한 경우다. 저절로 다시 부르면 같은 실패가 되풀이되므로 사용자가 고른다.
          다시 받는 동안에도 이 버튼이 서 있으므로 잠그고 대기를 보인다 (주문·후기 목록과 같은 처리, #427) */}
      {failed && (
        <Button
          variant="secondary"
          className="mt-5 min-h-11 text-label-bold-14"
          disabled={loading}
          onClick={onLoadMore}
        >
          <LoadingSwap loading={loading} label="상품을 더 불러오는 중">
            상품을 더 불러오지 못했어요. 다시 시도
          </LoadingSwap>
        </Button>
      )}
    </>
  );
}

type ResultsRegionProps = {
  resultsPromise: Promise<ProductSearchResult>;
  /** `resultsPromise`를 만든 검색어·정렬. 다음 쪽도 이 값으로 부른다 */
  resultsQuery: { keyword: string; sort: ProductSort };
  alreadyPicked: string | null;
  picking: boolean;
  picked: string | null;
  onPick: (id: string) => void;
  sort: ResultSort;
  onSortChange: (sort: ResultSort) => void;
  wishedIds: Set<number>;
  wishLoading: boolean;
  onToggleLike: (product: ProductCard) => void;
};

/** 결과 개수·정렬·목록·빈 상태를 한 덩어리로 묶는다. `use()`가 미결 상태인 동안
 *  바깥의 Suspense가 이 자리만 ResultsSkeleton으로 가린다 */
function ResultsRegion({
  resultsPromise,
  resultsQuery,
  alreadyPicked,
  picking,
  picked,
  onPick,
  sort,
  onSortChange,
  wishedIds,
  wishLoading,
  onToggleLike,
}: ResultsRegionProps) {
  const firstPage = use(resultsPromise);
  // "총 N개"는 첫 쪽이 센 전체 개수다. 목록은 끝에 닿을 때마다 다음 쪽을 이어 붙여 그 개수까지
  // 닿는다 — 첫 20개만 그리던 동안 "총 200개" 아래 카드가 20개에서 끝났다(QA SR-014, #532)
  const { items, totalCount, hasNext, loading, failed, loadMore } = useProductSearch(
    firstPage,
    resultsQuery,
  );
  // 반대쪽 자리에 이미 있는 상품은 고르는 목록에서 뺀다(#245) — key 충돌 방지
  const results = items.filter((item) => String(item.productId) !== alreadyPicked);

  if (results.length === 0) {
    return <NoResults />;
  }
  return (
    <>
      {picking ? (
        <PickingResultList results={results} picked={picked} onPick={onPick} />
      ) : (
        <GeneralResultList
          results={results}
          totalCount={totalCount}
          sort={sort}
          onSortChange={onSortChange}
          wishedIds={wishedIds}
          wishLoading={wishLoading}
          onToggleLike={onToggleLike}
        />
      )}
      <NextPageFooter
        hasNext={hasNext}
        loading={loading}
        failed={failed}
        onLoadMore={() => void loadMore()}
      />
    </>
  );
}

/** 카드 자리. 처음 그릴 때와 다음 쪽을 받을 때 함께 쓴다 */
function SkeletonCards({ count }: { count: number }) {
  return (
    // 본체와 같은 규칙으로 눕는다(#573) — 카드 170px 고정, 사이 13px
    <ul className="flex flex-wrap gap-x-3.25 gap-y-5">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex w-42.5 flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </li>
      ))}
    </ul>
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
      <SkeletonCards count={8} />
    </div>
  );
}

type SearchResultViewProps = {
  /** `app/search/result/page.tsx`가 서버에서 만든, 아직 안 기다린 조회 결과(첫 쪽) */
  resultsPromise: Promise<ProductSearchResult>;
  /**
   * `resultsPromise`를 만든 검색어·정렬. 다음 쪽은 화면의 정렬 상태가 아니라 이 값으로 부른다 —
   * 정렬을 바꾸면 URL이 서버의 새 첫 쪽보다 먼저 바뀌어, 그 사이 이전 목록의 커서를 새 정렬로
   * 보내면 서버가 거절한다(커서에 정렬이 새겨져 있다). 홈 카테고리 목록의 `productsKey`와 같은 이유다(#289)
   */
  resultsQuery: { keyword: string; sort: ProductSort };
};

export function SearchResultView({ resultsPromise, resultsQuery }: SearchResultViewProps) {
  const router = useRouter();
  // 비교는 로그인해야 열린다. 고르기 모드는 주소로도 들어올 수 있어 확정할 때 한 번 더 본다 (#542 리뷰)
  const requireSession = useRequireSession();

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
  // 찜은 서버에 저장한다(#483). 화면 안 상태로 두던 동안 새로고침하면 사라지고 좋아요 탭에도
  // 뜨지 않았다. 로그인하지 않았으면 누를 때 로그인으로 보낸다
  const heart = useToggleWishlist();
  const { wishedIds, isLoading: wishLoading } = useWishedProductIds();
  const toggleLike = (product: ProductCard) =>
    heart.toggle(product.productId, !wishedIds.has(product.productId), toWishlistItem(product));
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
    //
    // 이 화면은 `(constrained)` 그룹 밖이라 폭을 스스로 진다(#573). 1200은
    // 브레이크포인트가 아니라 최대 폭이다 — 768~1199는 뷰포트를 다 쓰고 1200부터 멈춰
    // 가운데 선다. 거터 20px은 컨테이너가 아니라 섹션이 갖는다
    <div className="mx-auto flex min-h-dvh w-full max-w-300 flex-col">
      {/* 제목 자리를 검색바가 차지한다. PageHeader는 가운데 제목을 전제로 해서 쓰지 않는다 */}
      {/* 검색 화면과 같은 머리말이다. 뒤로가기는 모든 헤더와 같은 조각이고 높이 48·좌우 20이다(#513) */}
      <header className="flex h-12 items-center px-5">
        <HeaderBackButton onClick={() => router.back()} />

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
          // 돋보기는 검색 화면 입력창과 같게 안쪽 12px에 24px, 글자는 안쪽 40px에서 시작한다.
          // min-w-0이 없으면 flex-1이어도 검색어 길이만큼 넓어져 안쪽 truncate가 먹지 않는다 —
          // 띄어쓰기 없는 200자 검색어에 문서 폭이 1618px까지 늘었다(#532)
          className="flex min-h-11 min-w-0 flex-1 items-center gap-1 rounded-lg bg-secondary px-3 text-left transition-colors hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Icon name="search" className="size-6 shrink-0 text-icon-stroke-tertiary" />
          <span className="truncate text-sm text-foreground">{keyword}</span>
          <span className="sr-only">검색어 고치기</span>
        </button>
      </header>

      {/* 거터 20px은 헤더(px-5)와 같고, 격자 전환점이 성립하는 조건이다(#573) —
          3열 576 = 170×3+13×2+40처럼 좌우 40px을 전제로 열 수가 갈린다 */}
      <main className="flex flex-1 flex-col px-5 pt-2 pb-4">
        {/* 결과 영역이 서버 조회를 기다리는 동안엔 개수를 몰라 6px/12px 간격을 못 가른다.
            픽킹 모드가 아니면 우선 좁은 간격(6px)으로 둔다 — 결과 없음일 때만 약간 더
            벌어져 보일 수 있는 정도라 이번 단계에서는 감수한다 */}
        <h1 className={cn("text-base font-bold text-foreground", !picking ? "mb-1.5" : "mb-3")}>
          검색 결과
        </h1>

        <Suspense fallback={<ResultsSkeleton />}>
          {/* 검색어·정렬이 바뀌면 이어 받던 목록·커서를 버리고 새 첫 쪽부터 다시 세운다. key가 없으면
              새 첫 쪽이 와도 이전 정렬로 이어 붙인 목록이 그대로 남는다 */}
          <ResultsRegion
            key={`${resultsQuery.keyword}:${resultsQuery.sort}`}
            resultsPromise={resultsPromise}
            resultsQuery={resultsQuery}
            alreadyPicked={alreadyPicked}
            picking={picking}
            picked={picked}
            onPick={(id) => setPicked((prev) => (prev === id ? null : id))}
            sort={sort}
            onSortChange={(next) => void setSort(next)}
            wishedIds={wishedIds}
            wishLoading={wishLoading}
            onToggleLike={toggleLike}
          />
        </Suspense>
      </main>

      {picking ? (
        <BottomActionBar>
          <Button
            disabled={!picked}
            onClick={() => {
              if (!picked || !requireSession()) return;
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
