// 검색 결과 화면. 검색어에 걸린 상품을 2열로 보이고 정렬을 고를 수 있다.
// UI 시안 기준(#245, 2396-80432, 고르기 1117-6424)이다.
//
// 검색 입력 화면과 나눠 둔 이유는 머리말 동작이 반대라서다. 입력 화면은 들어오자마자
// 칠 수 있어야 하고, 결과 화면의 검색바는 누르면 입력 화면으로 되돌아가는 버튼이다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { IoChevronBack, IoSearchOutline } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { BottomNav } from "@/widgets/bottom-nav";
import { Icon } from "@/shared/ui/icon/icon";

/** IA의 검색 결과 행에 적힌 목록. 메인의 정렬과 달라 여기 따로 둔다 */
const SORTS = ["recommend", "popular", "price-low", "price-high", "reviews"] as const;

const SORT_LABEL: Record<(typeof SORTS)[number], string> = {
  recommend: "추천순",
  popular: "인기순",
  "price-low": "낮은 가격순",
  "price-high": "높은 가격순",
  reviews: "리뷰 많은순",
};

/** API 계약 확정 전까지 화면 확인용 값 */
const MOCK_RESULTS = [
  {
    id: "1",
    name: "중소형견 소포장 사료 1kg",
    price: 31500,
    originalPrice: 42000,
    dailyCost: 1050,
    rating: 4.8,
    reviewCount: 108,
    salesCount: 1240,
    matchScore: 92,
  },
  {
    id: "2",
    name: "노령견 저지방 소화케어 사료 1kg",
    price: 27200,
    originalPrice: 32000,
    dailyCost: 1050,
    rating: 4.5,
    reviewCount: 108,
    salesCount: 860,
    matchScore: 86,
  },
  {
    id: "3",
    name: "알레르기 케어 무곡물 사료 1kg",
    price: 26100,
    originalPrice: 29000,
    dailyCost: 1060,
    rating: 4.8,
    reviewCount: 508,
    salesCount: 3100,
    matchScore: 74,
  },
  {
    id: "4",
    name: "퍼피 성장기 사료 1kg",
    price: 21000,
    dailyCost: 1060,
    rating: 4.6,
    reviewCount: 109,
    salesCount: 420,
    matchScore: 68,
  },
  // 시안은 사료 검색 결과지만, 목록이 사료뿐이면 다른 말로 검색했을 때 늘 비어 보인다
  {
    id: "5",
    name: "저자극 덴탈껌 14개입",
    price: 10800,
    originalPrice: 13100,
    dailyCost: 771,
    rating: 4.9,
    reviewCount: 203,
    salesCount: 2050,
    matchScore: 88,
  },
  {
    id: "6",
    name: "고양이 화장실 모래 6L",
    price: 14900,
    dailyCost: 620,
    rating: 4.4,
    reviewCount: 62,
    salesCount: 180,
    matchScore: 61,
  },
  // 영양 정보가 등록되지 않아 적합도를 재지 못한 상품. 가장 싸지만 최하단으로 간다
  {
    id: "7",
    name: "실속형 대용량 사료 5kg",
    price: 18900,
    dailyCost: 540,
    rating: 4.2,
    reviewCount: 31,
    salesCount: 640,
    matchScore: null,
  },
  // 상세(면역 지원 영양제)에서 비교하러 오면 같은 종류(supplement)가 있어야
  // 비교표가 뜬다. 검색에서 실제로 고를 수 있게 여기에도 둔다
  {
    id: "8",
    name: "관절 건강 영양제 60정",
    price: 24000,
    originalPrice: 27000,
    dailyCost: 800,
    rating: 4.6,
    reviewCount: 74,
    salesCount: 390,
    matchScore: 81,
  },
];

type Product = (typeof MOCK_RESULTS)[number];

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
  results: Product[];
  sort: (typeof SORTS)[number];
  onSortChange: (sort: (typeof SORTS)[number]) => void;
  liked: string[];
  onToggleLike: (id: string) => void;
};

/** 그냥 검색하러 왔을 때. 총 개수·정렬·할인율·별점·찜하기가 있다(2396-80432) */
function GeneralResultList({
  results,
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
        <p className="text-label-medium-14 text-text-body-secondary">총 {results.length}개</p>
        {/* home-view의 정렬 드롭다운(1758-69100)과 같은 조합이다 — 트리거 글자 크기(22px)에
            after:로 44px 탭 영역만 넓히고, 패널은 고른 항목을 체크 아이콘 대신
            배경색(bg-surface-weak)으로만 구분한다 */}
        <Select value={sort} onValueChange={(next) => onSortChange(next as (typeof SORTS)[number])}>
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
        {results.map((product) => (
          <li key={product.id}>
            <ProductGridCard
              href={`/products/${product.id}`}
              name={product.name}
              price={product.price}
              originalPrice={product.originalPrice}
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
                  onClick={() => onToggleLike(product.id)}
                  aria-pressed={liked.includes(product.id)}
                  aria-label={`${product.name} 찜하기`}
                  className="relative flex size-8 items-center justify-center rounded-full bg-surface-overlay-dimmed text-icon-fill-static-white after:absolute after:-inset-1.5"
                >
                  {liked.includes(product.id) ? (
                    <Icon name="heart_fill" aria-hidden className="size-6" />
                  ) : (
                    <Icon name="heart_stroke" aria-hidden className="size-6" />
                  )}
                </button>
              }
              meta={
                <>
                  <p className="text-xs text-muted-foreground">
                    하루 예상 급여비 약 {product.dailyCost.toLocaleString("ko-KR")}원
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
        ))}
      </ul>
    </div>
  );
}

type PickingResultListProps = {
  results: Product[];
  picked: string | null;
  onPick: (id: string) => void;
};

/** 비교 자리를 채우러 왔을 때. 시안(1117-6424)은 총 개수·정렬 없이 체크박스와
 *  이름·가격만 있다 — 무엇이 더 맞는지·싼지가 아니라 고르는 것 자체가 목적이다 */
function PickingResultList({ results, picked, onPick }: PickingResultListProps) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
      {results.map((product) => (
        <li key={product.id}>
          <ProductGridCard
            selectable
            selected={picked === product.id}
            onSelect={() => onPick(product.id)}
            name={product.name}
            price={product.price}
            priceClassName="text-title-bold-16"
          />
        </li>
      ))}
    </ul>
  );
}

/** 검색어에 걸리는지 본다. 서버 연동 전까지 화면 안에서 거른다 */
function match(name: string, keyword: string) {
  const words = keyword.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  return words.some((word) => name.toLowerCase().includes(word.toLowerCase()));
}

/** 목업 정렬 규칙. 연동하면 서버가 정렬해 주므로 이 자리는 통째로 사라진다 */
const COMPARE: Record<(typeof SORTS)[number], (a: Product, b: Product) => number> = {
  // 재지 못한 것은 아래 정렬에서 이미 최하단으로 빠져 여기서는 0으로 둔다
  recommend: (a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0),
  popular: (a, b) => b.salesCount - a.salesCount,
  "price-low": (a, b) => a.price - b.price,
  "price-high": (a, b) => b.price - a.price,
  reviews: (a, b) => b.reviewCount - a.reviewCount,
};

export function SearchResultView() {
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
  // 일반 검색은 적합도 대신 찜하기를 보여준다(2396-80432). 비교 자리를 채우러 왔을 때는
  // 카드에 적합도를 따로 그리지 않지만(1117-6424), matchScore는 여전히 정렬 우선순위로
  // 쓰인다 — 재지 못한 상품을 마지막으로 미는 기준이 그때도 필요하다
  const [liked, setLiked] = useState<string[]>([]);
  const toggleLike = (id: string) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  const otherContext = slot !== null && other ? `&other=${encodeURIComponent(other)}` : "";
  const detailContext =
    slot !== null && from === "detail" && first
      ? `&from=detail&first=${encodeURIComponent(first)}`
      : "";
  // 정렬은 같은 목록을 좁히는 것이라 히스토리에 쌓지 않는다.
  // 쌓으면 뒤로가기를 여러 번 눌러야 화면을 떠난다
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORTS).withDefault("recommend"),
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

  // 실제로는 검색어와 정렬을 요청 파라미터로 넘겨 서버가 걸러 준다.
  // 목업 단계라 화면에서 거르고 정렬한다 — sort를 손에 쥐고 아무것도 하지 않으면
  // 정렬이 죽은 UI가 된다
  const results = MOCK_RESULTS.filter(
    (product) => match(product.name, keyword) && product.id !== alreadyPicked,
  ).sort((a, b) => {
    // 적합도를 재지 못한 상품은 어떤 정렬에서도 마지막이다. 점수를 모르는 상품이
    // 가격순 첫 줄에 오면 무엇을 기준으로 고르는지가 흐려진다
    const unknown = Number(a.matchScore === null) - Number(b.matchScore === null);
    return unknown !== 0 ? unknown : COMPARE[sort](a, b);
  });

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
        <h1
          // 일반 검색 결과(2396-80432)는 제목과 총 개수 줄 사이가 6px이라 좁다.
          // 결과 없음·비교 담기 화면은 그 줄이 없어 기존 12px을 유지한다
          className={cn(
            "text-base font-bold text-foreground",
            !picking && results.length > 0 ? "mb-1.5" : "mb-3",
          )}
        >
          검색 결과
        </h1>

        {results.length === 0 ? (
          <NoResults />
        ) : picking ? (
          <PickingResultList
            results={results}
            picked={picked}
            onPick={(id) => setPicked((prev) => (prev === id ? null : id))}
          />
        ) : (
          <GeneralResultList
            results={results}
            sort={sort}
            onSortChange={(next) => void setSort(next)}
            liked={liked}
            onToggleLike={toggleLike}
          />
        )}
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
