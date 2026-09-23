// 찜한 상품·최근에 본 상품·자주 산 상품을 탭으로 나눠 본다.
// UI 시안 기준(#274, 찜 탭 1117-4972, 빈 상태 2022-158710)이다. "최근에 봤어요"·
// "자주 샀어요"는 PD 확인 결과 이번 MVP 범위 밖이다(#274 QA 답변) — 탭은 남겨두고
// 눌러도 반응하지 않게 disabled로 막는다.
//
// 찜 탭은 실제 API로 연동했다(#390). 나머지 두 탭은 여전히 목데이터다.

"use client";

import Link from "next/link";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { IoClose } from "react-icons/io5";

import { CATEGORY_TO_API } from "@/entities/product";
import { useMutateWishlist, useQueryWishlist, type WishlistItem } from "@/entities/wishlist";
import { BottomNav } from "@/widgets/bottom-nav";
import { NotificationBell } from "@/widgets/notification-bell";
import { toAppMessageCode } from "@/shared/api/error-message";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { FilterChips } from "@/shared/ui/filter-chips/filter-chips";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { CATEGORIES, CATEGORY_VALUES, type LikesCategory } from "../model/category";

const TABS = ["liked", "recent", "often"] as const;
// 최근에 봤어요·자주 샀어요는 탭을 눌러도 안 바뀌지만, 주소로 ?tab=recent를 직접
// 치고 들어오면 그건 막지 못했다(CodeRabbit 지적) — URL이 받는 값도 찜 탭 하나로 좁힌다
const REACHABLE_TABS = ["liked"] as const;

type MockTab = Exclude<(typeof TABS)[number], "liked">;

type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  /** 자주 산 상품에만 있는 것 */
  boughtCount?: number;
  lastBought?: string;
};

/** 찜 목록 항목을 카드가 쓰는 모양으로 옮긴다. 할인이 없으면 정가가 판매가와 같아 카드가 취소선을 그리지 않는다 */
function toLikedProduct(item: WishlistItem): Product {
  return {
    id: String(item.productId),
    name: item.name,
    price: item.price,
    originalPrice: item.originalPrice,
  };
}

/** "최근에 봤어요"·"자주 샀어요" 전용, API 연동 전까지 화면 확인용 값 */
const MOCK: Record<MockTab, Product[]> = {
  recent: Array.from({ length: 4 }, (_, index) => ({
    id: `r${index}`,
    name: "그레인프리 연어 사료 2kg",
    price: 31200,
    originalPrice: 39000,
  })),
  often: [
    {
      id: "o0",
      name: "그레인프리 연어 사료 2kg",
      price: 31200,
      originalPrice: 39000,
      lastBought: "마지막 구매 2주 전",
    },
    {
      id: "o1",
      name: "그레인프리 연어 사료 2kg",
      price: 31200,
      originalPrice: 39000,
      boughtCount: 4,
    },
    {
      id: "o2",
      name: "그레인프리 연어 사료 2kg",
      price: 31200,
      originalPrice: 39000,
      boughtCount: 5,
    },
    {
      id: "o3",
      name: "그레인프리 연어 사료 2kg",
      price: 31200,
      originalPrice: 39000,
    },
  ],
};

/** 확인창 문구. 찜 탭 하트는 확인 없이 바로 풀려 이 표엔 없다 */
const REMOVE_TITLE: Record<MockTab, string> = {
  recent: "최근 본 목록에서 이 상품을 뺄까요?",
  often: "자주 사는 목록에서 이 상품을 뺄까요?",
};

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-foreground px-1.5 py-0.5 text-xs text-background">{children}</span>
  );
}

export function LikesView() {
  const [tab, setTab] = useQueryState(
    "tab",
    // 세 탭이 서로 다른 목록이라 뒤로가기로 되돌아올 수 있어야 한다.
    // nuqs 기본값 replace는 히스토리에 쌓지 않아 화면을 통째로 떠난다
    parseAsStringLiteral(REACHABLE_TABS).withDefault("liked").withOptions({ history: "push" }),
  );
  const [category, setCategory] = useQueryState(
    "category",
    parseAsStringLiteral(CATEGORY_VALUES).withDefault("all"),
  );
  const [items, setItems] = useState(MOCK);
  const [removing, setRemoving] = useState<{ tab: MockTab; product: Product } | null>(null);

  // 찜 응답엔 상품의 카테고리가 없어 프론트가 다시 거를 수 없다 — 카테고리 필터는
  // 서버 쿼리 파라미터로만 한다. "전체가 비었는지"와 "고른 카테고리에만 없는지"를
  // 가르려면 전체 조회가 따로 필요해(#390) 두 쿼리를 함께 둔다. all일 때
  // categoryQuery를 꺼서 같은 요청을 두 번 보내지 않는다
  const categoryCode = category === "all" ? undefined : CATEGORY_TO_API[category];
  const allQuery = useQueryWishlist();
  const needsCategoryQuery = category !== "all";
  const categoryQuery = useQueryWishlist(categoryCode, { enabled: needsCategoryQuery });

  const { remove: removeWishlistItem } = useMutateWishlist();

  // 선택 카테고리 화면은 전체 조회(빈 상태 판단용)와 카테고리 조회(실제 목록) 둘 다
  // 있어야 정확히 그릴 수 있어 하나의 화면 상태로 본다 — 하나만 실패해도 나머지로
  // 정상인 척하지 않는다. all에서는 카테고리 쿼리가 꺼져 있으니 그 상태를 판단에서
  // 뺀다. 캐시에 이미 데이터가 있는 채로 백그라운드 재조회만 실패한 경우는 화면을
  // 막지 않는다 — `items === undefined`(데이터 자체가 없음)일 때만 차단 오류로 본다
  const isLoading = allQuery.isLoading || (needsCategoryQuery && categoryQuery.isLoading);
  const blockingError =
    (allQuery.items === undefined ? allQuery.error : null) ??
    (needsCategoryQuery && categoryQuery.items === undefined ? categoryQuery.error : null);
  const isFetching = allQuery.isFetching || (needsCategoryQuery && categoryQuery.isFetching);
  const refetchLiked = () => {
    void allQuery.refetch();
    if (needsCategoryQuery) void categoryQuery.refetch();
  };

  const likedAll = allQuery.items ?? [];
  const likedVisible = (needsCategoryQuery ? (categoryQuery.items ?? []) : likedAll).map(
    toLikedProduct,
  );

  // 어느 탭(최근에 봤어요·자주 샀어요)에서 뺀 것인지를 `tab`(항상 "liked") 대신
  // 직접 받는다 — 찜 탭이 실제 API로 바뀌면서 이 로컬 상태는 그 두 탭 전용이 됐다
  const remove = (tabKey: MockTab, id: string) => {
    setItems((prev) => ({ ...prev, [tabKey]: prev[tabKey].filter((item) => item.id !== id) }));
    setRemoving(null);
  };

  const closeButton = (tabKey: MockTab, product: Product) => (
    <button
      type="button"
      onClick={() => setRemoving({ tab: tabKey, product })}
      aria-label={`${product.name} 목록에서 빼기`}
      className="flex size-11 items-center justify-center text-foreground"
    >
      <IoClose aria-hidden className="size-5" />
    </button>
  );

  // 찜 탭의 하트는 누르면 바로 풀린다. 취소 기능이 없어 하나씩 눌러야 하는데
  // 그때마다 확인 모달·토스트가 뜨면 오히려 방해된다는 PD 판단이라 확인 없이 바로 뺀다
  // (#274 QA 답변). 시안(1117-4972 slot_2)은 흰 원판(32px) 위 채워진 하트, 사진 오른쪽 위 4px이다.
  // 대기 표시 없음 — 낙관적 갱신으로 즉시 반영한다. useMutateWishlist가 캐시를 먼저
  // 비우고 실패하면 되돌린다
  const heartButton = (product: Product) => (
    <button
      type="button"
      onClick={() => removeWishlistItem(Number(product.id))}
      aria-pressed
      aria-label={`${product.name} 찜 풀기`}
      className="relative flex size-8 items-center justify-center rounded-full bg-surface-overlay-static after:absolute after:-inset-1.5"
    >
      <Icon name="heart_fill" aria-hidden className="size-6 text-brand" />
    </button>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 시안(header, 1585:18342)은 로고가 아니라 뒤로가기 화살표 + 검색·알림·장바구니고
          제목이 없다. /likes가 바텀내비 탭 루트라 home-view와 같은 로고형이라고 판단해
          PageHeader를 걷어냈던 게 틀렸다 — 원래대로 되돌린다(leading 기본값 back 그대로).
          오른쪽 아이콘도 home-view 헤더와 같은 조합(아이콘 28px·4px 간격)이라 그 마크업을
          그대로 쓴다 — deals-view의 44px 터치영역·24px 아이콘은 제목이 있는 다른 헤더 값이다 */}
      <PageHeader
        right={
          <nav aria-label="바로 가기" className="flex items-center gap-2.25">
            <Link
              href="/search"
              aria-label="검색"
              className="after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2"
            >
              <Icon name="search" className="size-7" />
            </Link>
            <NotificationBell />
            <Link
              href="/cart"
              aria-label="장바구니"
              className="after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2"
            >
              <Icon name="cart" className="size-7" />
            </Link>
          </nav>
        }
      />

      <main className="flex flex-1 flex-col pb-8">
        <Tabs
          value={tab}
          onValueChange={(next) => void setTab(next as (typeof REACHABLE_TABS)[number])}
        >
          {/* 시안(1117-4999)은 3등분 밑줄 탭이다 — 고른 탭만 굵게+검정 밑줄, 나머지는
              회색 글자다. variant="line"의 밑줄을 시안 두께(1.5px)·위치(바로 아래)로 옮긴다 */}
          <TabsList variant="line" className="h-auto w-full gap-0 rounded-none bg-transparent p-0">
            <TabsTrigger
              value="liked"
              className="h-8.5 flex-1 rounded-none text-body-medium-16 text-text-body-secondary after:bottom-0 after:h-[1.5px] after:bg-border-strong data-active:text-title-bold-16 data-active:text-primary"
            >
              찜했어요
            </TabsTrigger>
            {/* MVP 범위 밖이라 눌러도 반응하지 않는다(#274 QA 답변) — 탭 자체는 시안대로 둔다 */}
            <TabsTrigger
              value="recent"
              disabled
              className="h-8.5 flex-1 rounded-none text-body-medium-16 text-text-body-secondary after:bottom-0 after:h-[1.5px] after:bg-border-strong data-active:text-title-bold-16 data-active:text-primary"
            >
              최근에 봤어요
            </TabsTrigger>
            <TabsTrigger
              value="often"
              disabled
              className="h-8.5 flex-1 rounded-none text-body-medium-16 text-text-body-secondary after:bottom-0 after:h-[1.5px] after:bg-border-strong data-active:text-title-bold-16 data-active:text-primary"
            >
              자주 샀어요
            </TabsTrigger>
          </TabsList>

          {TABS.map((value) => {
            const isLiked = value === "liked";
            const visible = isLiked ? likedVisible : items[value as MockTab];

            return (
              <TabsContent key={value} value={value} className="flex flex-col gap-4 pt-4">
                {/* 카테고리로 거르는 것은 찜 탭에만 있다(시안 1117-4972). 칩 자체(36px 알약,
                    고른 것만 bg-primary)는 FilterChips와 정확히 같은 시안값이라 그대로 쓴다.
                    빈 상태 시안(2022-158710)엔 칩 줄 자체가 없어, 찜한 상품이 하나도 없을
                    때는(거른 결과가 아니라 원본이 빈 것) 칩도 같이 감춘다 */}
                {isLiked && likedAll.length > 0 && (
                  <div className="px-5">
                    <FilterChips
                      label="상품 분류"
                      options={CATEGORIES}
                      value={category}
                      onValueChange={(next) => void setCategory(next as LikesCategory)}
                    />
                  </div>
                )}

                {isLiked && isLoading ? (
                  // 뼈대는 눈으로만 읽히는 표시다. 스크린 리더에는 불러오는 중이라고 말로 알린다
                  <div role="status" aria-live="polite" className="px-5">
                    <span className="sr-only">찜한 상품을 불러오는 중</span>
                    <div aria-hidden className="grid grid-cols-2 gap-x-3 gap-y-5">
                      {Array.from({ length: 4 }, (_, index) => (
                        <div key={index} className="flex flex-col gap-2">
                          <Skeleton className="aspect-square w-full rounded-lg" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : isLiked && blockingError ? (
                  // 조회 실패는 토스트로 알리지 않는다(AppProviders 주석). 화면에서 다시 시도할 수 있게 한다
                  <EmptyState
                    role="alert"
                    className="flex-1"
                    {...APP_MESSAGE[toAppMessageCode(blockingError)]}
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-11 px-3"
                        disabled={isFetching}
                        onClick={refetchLiked}
                      >
                        <LoadingSwap loading={isFetching} label="다시 불러오는 중">
                          다시 시도
                        </LoadingSwap>
                      </Button>
                    }
                  />
                ) : visible.length === 0 ? (
                  // 찜한 상품은 있는데 고른 카테고리에만 없는 경우와, 찜한 상품 자체가
                  // 없는 경우는 다르다(CodeRabbit 지적) — 전자에 "아직 담아둔 상품이
                  // 없어요"를 그대로 쓰면 다른 칩엔 상품이 있는데도 하나도 없는 것처럼
                  // 읽힌다. 문구 자체는 확정 시안이 없어 임시로 채운다
                  <EmptyState
                    icon={<Icon name="heart_fill" />}
                    title={
                      isLiked && likedAll.length > 0
                        ? "이 카테고리엔 담아둔 상품이 없어요"
                        : "아직 담아둔 상품이 없어요"
                    }
                    description={
                      isLiked && likedAll.length > 0
                        ? "다른 카테고리도 확인해보세요"
                        : "마음에 드는 상품을 발견하면 하트를 꾹 눌러주세요"
                    }
                    className="flex-1"
                  />
                ) : (
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-5 px-5">
                    {visible.map((product) => (
                      <li key={product.id} className="flex">
                        <ProductGridCard
                          className="flex-1"
                          href={`/products/${product.id}`}
                          name={product.name}
                          price={product.price}
                          originalPrice={product.originalPrice}
                          // 찜 탭만 시안이 확정돼 우측 상단 4px로 옮긴다(공용 기본값은 12px).
                          // 나머지 탭은 확정 시안이 없어 공용 기본 위치를 그대로 둔다
                          imageActionClassName={isLiked ? "top-1 right-1" : undefined}
                          imageAction={
                            isLiked ? heartButton(product) : closeButton(value as MockTab, product)
                          }
                          imageBadge={
                            product.lastBought ? (
                              <CountBadge>{product.lastBought}</CountBadge>
                            ) : product.boughtCount ? (
                              <CountBadge>{product.boughtCount}회 구매</CountBadge>
                            ) : undefined
                          }
                          footer={
                            value === "often" ? (
                              <div className="flex gap-1 pt-1">
                                {/* 고른 상품을 함께 넘기지는 못한다. 화면 간 전달은 라우터 구조가
                                    정해진 뒤에 붙인다 — 장바구니의 "결제하기"와 같은 수준이다 */}
                                <Button
                                  variant="outline"
                                  className="min-h-11 flex-1 text-xs"
                                  asChild
                                >
                                  <Link href="/cart">장바구니</Link>
                                </Button>
                                <Button className="min-h-11 flex-1 text-xs" asChild>
                                  <Link href="/payment">구매하기</Link>
                                </Button>
                              </div>
                            ) : undefined
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </main>

      {/* 시안(1117-4972)의 navigation 인스턴스다. /likes는 BottomNav의 네 경로 중 하나라
          "좋아요" 탭이 그대로 켜진다(#273의 /recommendations와 다른 점) */}
      <BottomNav />

      {/* 빼기는 되돌릴 수 없어 확인 창으로 막는다. 찜 탭(하트)은 확인 없이 바로 빠져
          이 모달을 거치지 않는다 — 최근에 봤어요·자주 샀어요 전용이다 */}
      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>{removing && REMOVE_TITLE[removing.tab]}</AlertDialogTitle>
          <AlertDialogDescription>
            목록에서 지워도 언제든지 다시 찾아서 살 수 있어요
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">닫기</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11"
              onClick={() => removing && remove(removing.tab, removing.product.id)}
            >
              지우기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
