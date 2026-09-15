// 메인 화면. 전체 탭은 골라주는 화면이고, 종류 탭은 상품 목록이다.
// 와이어프레임 기준(메인, 메인_사료 탭, 메인_타임딜 없을 때)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import { PetSwitcher, ProductFeedbackSheet, type FeedbackTarget } from "@/entities/pet";
import { MatchScoreBadge } from "@/entities/product";
import { Button } from "@/shared/ui/button";
import { Countdown } from "@/shared/ui/countdown/countdown";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { Rating } from "@/shared/ui/rating/rating";
import { ScrollRow, ScrollRowItem } from "@/shared/ui/scroll-row/scroll-row";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { BottomNav } from "@/widgets/bottom-nav";

const CATEGORIES = ["all", "food", "snack", "supplement"] as const;
const CATEGORY_LABEL: Record<(typeof CATEGORIES)[number], string> = {
  all: "전체",
  food: "사료",
  snack: "간식",
  supplement: "영양제",
};

type Sort = { value: string; label: string; hint?: string };

/** 시안 메인_사료 탭의 정렬 목록. 추천순이 기본이다 */
const SORTS: Sort[] = [
  { value: "recommend", label: "추천순", hint: "AI 추천 로직 · 기본" },
  { value: "popular", label: "인기순", hint: "판매순" },
  { value: "reviews", label: "리뷰 많은 순" },
  { value: "rating-high", label: "리뷰 높은 순" },
  { value: "rating-low", label: "리뷰 낮은 순" },
];
const SORT_VALUES = ["recommend", "popular", "reviews", "rating-high", "rating-low"] as const;

/** API 연동 전까지 화면 확인용 값 */
const MOCK_PETS = [
  { id: "1", name: "소리" },
  { id: "2", name: "냥이" },
];

const MOCK_PRODUCTS = Array.from({ length: 6 }, (_, index) => ({
  id: String(index + 1),
  name: index % 2 === 0 ? "그레인프리 연어 사료 2kg" : "저자극 덴탈껌 14개입",
  price: index % 2 === 0 ? 31200 : 10800,
  originalPrice: index % 2 === 0 ? 38000 : 13100,
  dailyCost: index % 2 === 0 ? 1050 : 771,
  dailyLabel: index % 2 === 0 ? "하루 예상 급여비" : "1개당",
  rating: index % 2 === 0 ? 4.8 : 4.9,
  reviewCount: index % 2 === 0 ? 108 : 203,
  matchScore: 92 - index * 6,
}));

const MOCK_RECENT: FeedbackTarget[] = [
  {
    productId: "1",
    productName: "저자극 덴탈껌 14개입",
    sinceLabel: "구매 후 6일",
    countLabel: "3번째 구매",
  },
  {
    productId: "2",
    productName: "그레인프리 연어 사료 2kg",
    sinceLabel: "구매 후 12일",
    countLabel: "2번째 구매",
  },
];

/** 타임딜 종료 시각. 실제로는 서버가 준다 */
const DEAL_ENDS_AT = new Date(Date.now() + 11 * 3600_000 + 28 * 60_000 + 43_000);

/** 시안 ProductCard/Grid의 price 슬롯 — 하루 급여비 캡션 + 별점 + 후기 수를 한 자리에 */
function ProductMeta({ product }: { product: (typeof MOCK_PRODUCTS)[number] }) {
  return (
    <>
      <p className="text-label-medium-11 text-text-body-tertiary">
        {product.dailyLabel} 약 {product.dailyCost.toLocaleString("ko-KR")}원
      </p>
      <div className="flex items-center gap-2">
        <Rating value={product.rating} showValue />
        <span className="text-label-medium-14 text-text-body-tertiary">
          후기 {product.reviewCount}
        </span>
      </div>
    </>
  );
}

function SectionTitle({ children, href }: { children: React.ReactNode; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-title-bold-20 text-foreground">{children}</h2>
      {href && (
        <Link
          href={href}
          className="flex min-h-11 items-center text-label-medium-14 text-text-body-tertiary"
        >
          더보기
        </Link>
      )}
    </div>
  );
}

export function HomeView() {
  const [category, setCategory] = useQueryState(
    "category",
    // 전체 탭은 큐레이션, 종류 탭은 상품 목록으로 구성이 통째로 다르다.
    // 같은 목록의 필터가 아니므로 뒤로가기로 되돌아올 수 있어야 한다
    parseAsStringLiteral(CATEGORIES).withDefault("all").withOptions({ history: "push" }),
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORT_VALUES).withDefault("recommend"),
  );
  const [petId, setPetId] = useState(MOCK_PETS[0].id);
  const [feedback, setFeedback] = useState<FeedbackTarget | null>(null);
  const [dealOver, setDealOver] = useState(false);

  const pet = MOCK_PETS.find((item) => item.id === petId) ?? MOCK_PETS[0];

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 시안 header/type=logo. 실제 로고 이미지 자산이 아직 없어 글자를 그대로 둔다 */}
      <header className="flex h-12 items-center justify-between px-5">
        <p className="text-title-bold-18 text-brand">골라주개냥</p>
        <nav aria-label="바로 가기" className="flex items-center gap-1">
          <Link
            href="/search"
            aria-label="검색"
            className="flex size-11 items-center justify-center"
          >
            <Icon name="search" className="size-6" />
          </Link>
          <Link
            href="/mypage/notifications"
            aria-label="알림"
            className="flex size-11 items-center justify-center"
          >
            <Icon name="bell_noti" className="size-6" />
          </Link>
          <Link
            href="/cart"
            aria-label="장바구니에 5개"
            className="relative flex size-11 items-center justify-center"
          >
            <Icon name="cart" className="size-6" />
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] text-brand-foreground"
            >
              5
            </span>
          </Link>
        </nav>
      </header>

      {/* 탭처럼 보이지만 탭 역할을 주지 않는다. 고르면 화면 구성이 통째로 바뀌고 주소도 달라져
          연결할 패널이 없다. 지금 어느 것을 보고 있는지는 aria-current로 알린다.
          시안 tap_item: 활성은 label-bold-14 + 검정 밑줄, 비활성은 label-medium-14 + 회색 */}
      <nav aria-label="상품 종류" className="flex px-5">
        {CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            aria-current={category === value ? "page" : undefined}
            onClick={() => void setCategory(value)}
            className={
              category === value
                ? "min-h-11 border-b border-border-strong px-2 text-label-bold-14 text-text-label-default"
                : "min-h-11 border-b border-transparent px-2 text-label-medium-14 text-text-body-tertiary"
            }
          >
            {CATEGORY_LABEL[value]}
          </button>
        ))}
      </nav>

      <main className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-24">
        {category === "all" ? (
          <>
            {/* 프로모션 배너. 시안은 문구 없이 사진 배너 하나다 — 홍보 문구는 이미지 안에 들어간다 */}
            <section aria-label="진행 중인 행사">
              <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
                {/* 배너가 여럿임을 알리는 자리. 넘기는 것은 서버 데이터가 붙은 뒤에 잇는다 */}
                <span
                  aria-hidden
                  className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1"
                >
                  <span className="size-1.5 rounded-full bg-foreground" />
                  <span className="size-1.5 rounded-full bg-background ring-1 ring-border" />
                  <span className="size-1.5 rounded-full bg-background ring-1 ring-border" />
                </span>
              </div>
            </section>

            <PetSwitcher
              pets={MOCK_PETS}
              selectedId={petId}
              onSelect={setPetId}
              onAdd={() => {}}
              withNames
              className="gap-4 p-0"
            />

            <section className="flex flex-col gap-3">
              <SectionTitle href="/recommendations">
                AI가 골라주는 {pet.name} 맞춤 상품
              </SectionTitle>
              <ScrollRow label={`${pet.name} 맞춤 상품`}>
                {MOCK_PRODUCTS.slice(0, 4).map((product) => (
                  <ScrollRowItem key={product.id}>
                    <ProductGridCard
                      href={`/products/${product.id}`}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      imageBadge={
                        <MatchScoreBadge score={product.matchScore} petName={pet.name} size="sm" />
                      }
                      imageAction={
                        <span
                          aria-hidden
                          className="flex size-11 items-center justify-center text-foreground"
                        >
                          <Icon name="heart_stroke" className="size-5" />
                        </span>
                      }
                      meta={<ProductMeta product={product} />}
                    />
                  </ScrollRowItem>
                ))}
              </ScrollRow>
            </section>

            {/* 이 서비스가 근거를 모으는 자리 */}
            <section className="flex flex-col gap-3">
              <SectionTitle>최근에 구매한 상품, 아이는 어때요?</SectionTitle>
              <ScrollRow label="최근에 구매한 상품" itemWidth="80%">
                {MOCK_RECENT.map((item) => (
                  <ScrollRowItem key={item.productId}>
                    <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
                      <div className="flex items-center gap-3">
                        <span aria-hidden className="size-15 shrink-0 rounded-lg bg-muted" />
                        <div className="flex min-w-0 flex-col gap-1">
                          <p className="truncate text-label-bold-14 text-foreground">
                            {item.productName}
                          </p>
                          <p className="flex gap-1 text-xs">
                            <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                              {item.sinceLabel}
                            </span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                              {item.countLabel}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Button
                        className="min-h-11 w-full bg-brand text-brand-foreground hover:bg-brand/90"
                        onClick={() => setFeedback(item)}
                      >
                        우리 아이 반응 남기기
                      </Button>
                    </div>
                  </ScrollRowItem>
                ))}
              </ScrollRow>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-title-bold-20 text-foreground">
                {dealOver ? (
                  "오늘의 타임딜"
                ) : (
                  <>
                    매주 목요일 밤 12시 <span className="text-brand">타임딜 특가</span>
                  </>
                )}
              </h2>

              {dealOver ? (
                <EmptyState
                  icon={<Icon name="clock" />}
                  title="지금은 진행 중인 타임딜이 없어요"
                  description="매주 목요일 밤 12시에 새로운 특가가 열려요"
                  className="rounded-xl border border-dashed border-border px-0 py-4"
                  action={
                    <button
                      type="button"
                      // 알림 신청 API가 아직 없어 자리만 만들어 둔다
                      onClick={() => {}}
                      className="min-h-11 px-2.5 text-body-medium-14 text-brand"
                    >
                      오픈 알림 받기
                    </button>
                  }
                />
              ) : (
                <>
                  <div className="flex flex-col gap-0.5">
                    <Countdown endsAt={DEAL_ENDS_AT} onEnd={() => setDealOver(true)} />
                    <p className="text-body-regular-14 text-text-body-secondary">
                      종료까지 남은 시간
                    </p>
                  </div>

                  <ScrollRow label="타임딜 상품">
                    {MOCK_PRODUCTS.slice(0, 4).map((product) => (
                      <ScrollRowItem key={product.id}>
                        <ProductGridCard
                          href={`/products/${product.id}`}
                          name={product.name}
                          price={product.price}
                          originalPrice={product.originalPrice}
                          meta={<ProductMeta product={product} />}
                        />
                      </ScrollRowItem>
                    ))}
                  </ScrollRow>

                  <Button variant="outline" className="min-h-11 w-full text-label-bold-16" asChild>
                    <Link href="/deals">특가 더보기</Link>
                  </Button>
                </>
              )}

              {/* 화면 확인용. 서버가 주는 값으로 바뀐다 */}
              <button
                type="button"
                onClick={() => setDealOver((prev) => !prev)}
                className="min-h-11 text-xs text-muted-foreground underline underline-offset-4"
              >
                {dealOver ? "타임딜 있는 화면 보기" : "타임딜 없는 화면 보기"}
              </button>
            </section>
          </>
        ) : (
          <>
            <div className="flex justify-end">
              <Select
                value={sort}
                onValueChange={(next) => void setSort(next as (typeof SORT_VALUES)[number])}
              >
                <SelectTrigger aria-label="정렬" className="min-h-11 w-auto border-0 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                      {item.hint && (
                        <span className="ml-2 text-xs text-muted-foreground">{item.hint}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
              {MOCK_PRODUCTS.map((product) => (
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
                    meta={<ProductMeta product={product} />}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <BottomNav />

      <ProductFeedbackSheet
        target={feedback}
        petName={pet.name}
        onOpenChange={(open) => !open && setFeedback(null)}
      />
    </div>
  );
}
