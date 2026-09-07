// 검색 결과 화면. 검색어에 걸린 상품을 2열로 보이고 정렬을 고를 수 있다.
// 와이어프레임 기준(검색 화면_검색 결과 화면)이라 디자인 확정 시 바뀔 수 있다.
//
// 검색 입력 화면과 나눠 둔 이유는 머리말 동작이 반대라서다. 입력 화면은 들어오자마자
// 칠 수 있어야 하고, 결과 화면의 검색바는 누르면 입력 화면으로 되돌아가는 버튼이다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { IoChevronBack, IoSearchOutline } from "react-icons/io5";

import { MatchScoreBadge } from "@/entities/product";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { Rating } from "@/shared/ui/rating/rating";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { BottomNav } from "@/widgets/bottom-nav";

/** IA의 검색 결과 행에 적힌 목록. 메인의 정렬과 달라 여기 따로 둔다 */
const SORTS = ["recommend", "popular", "price-low", "price-high", "reviews"] as const;

const SORT_LABEL: Record<(typeof SORTS)[number], string> = {
  recommend: "추천순",
  popular: "인기순",
  "price-low": "낮은 가격순",
  "price-high": "높은 가격순",
  reviews: "리뷰 많은순",
};

/** 지금 고른 아이. 프로필 연동 전까지 화면 확인용 값이다 */
const PET_NAME = "소리";

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
];

type Product = (typeof MOCK_RESULTS)[number];

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
  // 정렬은 같은 목록을 좁히는 것이라 히스토리에 쌓지 않는다.
  // 쌓으면 뒤로가기를 여러 번 눌러야 화면을 떠난다
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORTS).withDefault("recommend"),
  );

  // 실제로는 검색어와 정렬을 요청 파라미터로 넘겨 서버가 걸러 준다.
  // 목업 단계라 화면에서 거르고 정렬한다 — sort를 손에 쥐고 아무것도 하지 않으면
  // 정렬이 죽은 UI가 된다
  const results = MOCK_RESULTS.filter((product) => match(product.name, keyword)).sort((a, b) => {
    // 적합도를 재지 못한 상품은 어떤 정렬에서도 마지막이다. 점수를 모르는 상품이
    // 가격순 첫 줄에 오면 무엇을 기준으로 고르는지가 흐려진다
    const unknown = Number(a.matchScore === null) - Number(b.matchScore === null);
    return unknown !== 0 ? unknown : COMPARE[sort](a, b);
  });

  return (
    <div className="flex min-h-dvh flex-col pb-16">
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
          onClick={() => router.push("/search")}
          className="flex min-h-11 flex-1 items-center gap-2 rounded-full bg-muted px-3 text-left transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <IoSearchOutline aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-foreground">{keyword}</span>
          <span className="sr-only">검색어 고치기</span>
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
        <h1 className="text-base font-bold text-foreground">검색 결과</h1>

        {results.length === 0 ? (
          <EmptyState title="검색 결과가 없어요" description="다른 말로 다시 찾아보세요." />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">총 {results.length}개</p>
              <Select
                value={sort}
                onValueChange={(next) => void setSort(next as (typeof SORTS)[number])}
              >
                <SelectTrigger aria-label="정렬" className="min-h-11 w-auto border-0 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {SORTS.map((value) => (
                    <SelectItem key={value} value={value}>
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
                    imageBadge={
                      <MatchScoreBadge score={product.matchScore} petName={PET_NAME} size="sm" />
                    }
                    meta={
                      <>
                        <p className="text-xs text-muted-foreground">
                          하루 예상 급여비 약 {product.dailyCost.toLocaleString("ko-KR")}원
                        </p>
                        <span className="flex items-center gap-1.5">
                          <Rating value={product.rating} showValue />
                          <span aria-hidden className="text-xs text-muted-foreground">
                            | 후기 {product.reviewCount}
                          </span>
                          <span className="sr-only">{`후기 ${product.reviewCount}개`}</span>
                        </span>
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
