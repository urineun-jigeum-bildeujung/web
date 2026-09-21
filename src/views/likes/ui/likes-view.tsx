// 찜한 상품·최근에 본 상품·자주 산 상품을 탭으로 나눠 본다.
// UI 시안 기준(#274, 찜 탭 1117-4972, 빈 상태 2022-158710)이다. "최근에 봤어요"·
// "자주 샀어요"는 PD 확인 결과 이번 MVP 범위 밖이다(#274 QA 답변) — 탭은 남겨두고
// 눌러도 반응하지 않게 disabled로 막는다.

"use client";

import Link from "next/link";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { IoClose } from "react-icons/io5";

import { BottomNav } from "@/widgets/bottom-nav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { FilterChips } from "@/shared/ui/filter-chips/filter-chips";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const TABS = ["liked", "recent", "often"] as const;
// 최근에 봤어요·자주 샀어요는 탭을 눌러도 안 바뀌지만, 주소로 ?tab=recent를 직접
// 치고 들어오면 그건 막지 못했다(CodeRabbit 지적) — URL이 받는 값도 찜 탭 하나로 좁힌다
const REACHABLE_TABS = ["liked"] as const;

// 찜 탭 전용 필터. PD가 알림 상태 대신 상품 카테고리로 거르는 걸로 바꿨다
// (#274 QA 답변, 1117-4972 chip 줄 갱신). /recommendations와 같은 값 체계를 쓴다.
const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "food", label: "사료" },
  { value: "snack", label: "간식" },
  { value: "supplement", label: "영양제" },
] as const;
const CATEGORY_VALUES = ["all", "food", "snack", "supplement"] as const;

type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  /** 찜 탭에만 있다. "all"은 필터 값일 뿐 상품에는 붙지 않는다 */
  category?: Exclude<(typeof CATEGORY_VALUES)[number], "all">;
  /** 자주 산 상품에만 있는 것 */
  boughtCount?: number;
  lastBought?: string;
};

/** API 연동 전까지 화면 확인용 값 */
const MOCK: Record<(typeof TABS)[number], Product[]> = {
  liked: [
    {
      id: "l0",
      name: "그레인프리 연어 사료 2kg",
      price: 25600,
      originalPrice: 32000,
      category: "food",
    },
    {
      id: "l1",
      name: "그레인프리 연어 사료 2kg",
      price: 31200,
      originalPrice: 39000,
      category: "snack",
    },
    {
      id: "l2",
      name: "그레인프리 연어 사료 2kg",
      price: 31200,
      originalPrice: 39000,
      category: "supplement",
    },
    {
      id: "l3",
      name: "그레인프리 연어 사료 2kg",
      price: 31200,
      originalPrice: 39000,
      category: "food",
    },
  ],
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

/**
 * 확인창 문구. 찜 탭 하트는 확인 없이 바로 풀려 `liked`는 실제로 쓰이지 않지만,
 * `tab` 타입이 세 값을 다 가져 레코드 타입을 좁히려면 캐스팅이 필요해 그대로 둔다
 */
const REMOVE_TITLE: Record<(typeof TABS)[number], string> = {
  liked: "찜 목록에서 이 상품을 뺄까요?",
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
  const [removing, setRemoving] = useState<Product | null>(null);

  // tab은 이제 URL로도 "liked" 하나뿐이라 다른 탭으로 걸러질 일이 없다
  const visible =
    category === "all" ? items.liked : items.liked.filter((item) => item.category === category);

  const remove = (id: string) => {
    setItems((prev) => ({ ...prev, [tab]: prev[tab].filter((item) => item.id !== id) }));
    setRemoving(null);
  };

  const closeButton = (product: Product) => (
    <button
      type="button"
      onClick={() => setRemoving(product)}
      aria-label={`${product.name} 목록에서 빼기`}
      className="flex size-11 items-center justify-center text-foreground"
    >
      <IoClose aria-hidden className="size-5" />
    </button>
  );

  // 찜 탭의 하트는 누르면 바로 풀린다. 취소 기능이 없어 하나씩 눌러야 하는데
  // 그때마다 확인 모달·토스트가 뜨면 오히려 방해된다는 PD 판단이라 확인 없이 바로 뺀다
  // (#274 QA 답변). 시안(1117-4972 slot_2)은 흰 원판(32px) 위 채워진 하트, 사진 오른쪽 위 4px이다
  const heartButton = (product: Product) => (
    <button
      type="button"
      onClick={() => remove(product.id)}
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
            <Link
              href="/mypage/notifications"
              aria-label="알림"
              className="after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2"
            >
              <Icon name="bell_noti" className="size-7" />
            </Link>
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

          {TABS.map((value) => (
            <TabsContent key={value} value={value} className="flex flex-col gap-4 pt-4">
              {/* 카테고리로 거르는 것은 찜 탭에만 있다(시안 1117-4972). 칩 자체(36px 알약,
                  고른 것만 bg-primary)는 FilterChips와 정확히 같은 시안값이라 그대로 쓴다.
                  빈 상태 시안(2022-158710)엔 칩 줄 자체가 없어, 찜한 상품이 하나도 없을
                  때는(거른 결과가 아니라 원본이 빈 것) 칩도 같이 감춘다 */}
              {value === "liked" && items.liked.length > 0 && (
                <div className="px-5">
                  <FilterChips
                    label="상품 분류"
                    options={CATEGORIES}
                    value={category}
                    onValueChange={(next) =>
                      void setCategory(next as (typeof CATEGORY_VALUES)[number])
                    }
                  />
                </div>
              )}

              {visible.length === 0 ? (
                // 찜한 상품은 있는데 고른 카테고리에만 없는 경우와, 찜한 상품 자체가
                // 없는 경우는 다르다(CodeRabbit 지적) — 전자에 "아직 담아둔 상품이
                // 없어요"를 그대로 쓰면 다른 칩엔 상품이 있는데도 하나도 없는 것처럼
                // 읽힌다. 문구 자체는 확정 시안이 없어 임시로 채운다
                <EmptyState
                  icon={<Icon name="heart_fill" />}
                  title={
                    value === "liked" && items.liked.length > 0
                      ? "이 카테고리엔 담아둔 상품이 없어요"
                      : "아직 담아둔 상품이 없어요"
                  }
                  description={
                    value === "liked" && items.liked.length > 0
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
                        imageActionClassName={value === "liked" ? "top-1 right-1" : undefined}
                        imageAction={
                          value === "liked" ? heartButton(product) : closeButton(product)
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
                              <Button variant="outline" className="min-h-11 flex-1 text-xs" asChild>
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
          ))}
        </Tabs>
      </main>

      {/* 시안(1117-4972)의 navigation 인스턴스다. /likes는 BottomNav의 네 경로 중 하나라
          "좋아요" 탭이 그대로 켜진다(#273의 /recommendations와 다른 점) */}
      <BottomNav />

      {/* 빼기는 되돌릴 수 없어 확인 창으로 막는다 */}
      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>{REMOVE_TITLE[tab]}</AlertDialogTitle>
          <AlertDialogDescription>
            목록에서 지워도 언제든지 다시 찾아서 살 수 있어요
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">닫기</AlertDialogCancel>
            <AlertDialogAction className="min-h-11" onClick={() => removing && remove(removing.id)}>
              지우기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
