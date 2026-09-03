// 고른 아이의 건강 고민에 맞는 상품을 모아 보여준다.
// 와이어프레임 기준(reco_001, reco_001_변경)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { IoHeart, IoHeartOutline } from "react-icons/io5";

import { MatchScoreBadge } from "@/entities/product";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { FilterChips } from "@/shared/ui/filter-chips/filter-chips";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { Rating } from "@/shared/ui/rating/rating";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

/** API 연동 전까지 화면 확인용 값 */
const MOCK_PETS = [
  { id: "1", name: "코코" },
  { id: "2", name: "봄이" },
];

const CONCERNS = [
  { value: "joint", label: "관절" },
  { value: "allergy", label: "알러지" },
  { value: "dental", label: "구강관리" },
] as const;

/** 주소로 받을 수 있는 값. CONCERNS와 같은 순서로 둔다 */
const CONCERN_VALUES = ["joint", "allergy", "dental"] as const;

/** 시안에 "맞춤 추천"만 보인다. 나머지 기준은 PD 확인 뒤에 늘린다. */
const SORTS = [{ value: "match", label: "맞춤 추천" }];

const MOCK_PRODUCTS = Array.from({ length: 9 }, (_, index) => ({
  id: String(index + 1),
  name: "그레인프리 연어 사료 2kg",
  price: 31200,
  // 시안에 31,200원·20%·37,440원으로 적혀 있으나 그 둘로는 16%가 나온다.
  // 할인율은 화면에서 계산하므로 20%가 되는 값으로 둔다.
  originalPrice: 39000,
  dailyCost: 1050,
  rating: 4.8,
  reviewCount: 108,
  // 적합도는 AI가 주는 값이다. 단위가 정해지지 않아 0~100으로 둔다.
  matchScore: 92 - index * 7,
  // 어떤 고민에 맞는 상품인지. 실제로는 AI가 골라 준다
  concern: CONCERNS[index % CONCERNS.length].value,
}));

export function RecommendationsView() {
  const [petId, setPetId] = useQueryState("pet", parseAsString.withDefault(MOCK_PETS[0].id));
  // 주소로 아무 값이나 올 수 있다. 목록에 없는 값이면 목록이 통째로 비므로 보기 안에서만 받는다.
  const [concern, setConcern] = useQueryState(
    "concern",
    parseAsStringLiteral(CONCERN_VALUES).withDefault("joint"),
  );
  const [sort, setSort] = useState(SORTS[0].value);
  const [liked, setLiked] = useState<string[]>([]);

  const pet = MOCK_PETS.find((item) => item.id === petId) ?? MOCK_PETS[0];
  const products = MOCK_PRODUCTS.filter((product) => product.concern === concern);

  const toggleLike = (id: string) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="상품 둘러보기" />

      <main className="flex flex-1 flex-col gap-3 px-4 pb-8">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {/* 아이를 바꾸면 추천도 바뀐다. 이름이 문장 안에 있어 고르는 자리로 보이게 둔다 */}
            <Select value={petId} onValueChange={(next) => void setPetId(next)}>
              <SelectTrigger
                aria-label="어느 아이의 추천을 볼지"
                className="size-auto min-h-11 rounded-full border-foreground bg-foreground px-3 text-sm font-medium text-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOCK_PETS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <h2 className="text-base font-bold break-keep text-foreground">
              의 건강 고민을 덜어줄 맞춤 상품을 찾았어요
            </h2>
          </div>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger
              aria-label="정렬"
              className="min-h-11 w-auto shrink-0 border-0 px-0 text-xs text-muted-foreground shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 시안은 "안내" 라벨과 한 문장이다. InfoNotice는 불릿 목록이라 여기엔 맞지 않는다 */}
        <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          <span className="shrink-0 font-medium text-foreground">안내</span>
          보호자님이 알려주신 건강 고민을 바탕으로 추천해요
        </p>

        <FilterChips
          label="건강 고민 고르기"
          options={CONCERNS}
          value={concern}
          onValueChange={(next) => void setConcern(next as (typeof CONCERN_VALUES)[number])}
        />

        {products.length === 0 ? (
          <EmptyState
            title={`${pet.name}에게 맞는 상품을 아직 찾지 못했어요`}
            description="아이 정보를 채우면 더 잘 골라드릴 수 있어요."
            className="flex-1"
          />
        ) : (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
            {products.map((product) => (
              <li key={product.id} className="flex">
                <ProductGridCard
                  className="flex-1"
                  href={`/products/${product.id}`}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  imageBadge={
                    <MatchScoreBadge score={product.matchScore} petName={pet.name} size="sm" />
                  }
                  imageAction={
                    <button
                      type="button"
                      onClick={() => toggleLike(product.id)}
                      aria-pressed={liked.includes(product.id)}
                      aria-label={`${product.name} 찜하기`}
                      className="flex size-11 items-center justify-center text-foreground"
                    >
                      {liked.includes(product.id) ? (
                        <IoHeart aria-hidden className="size-5" />
                      ) : (
                        <IoHeartOutline aria-hidden className="size-5" />
                      )}
                    </button>
                  }
                  meta={
                    <>
                      <p className="text-xs text-muted-foreground">
                        하루 예상 급여비 약 {product.dailyCost.toLocaleString("ko-KR")}원
                      </p>
                      <Rating value={product.rating} showValue className="text-xs" />
                      <span className="sr-only">후기 {product.reviewCount}개</span>
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
