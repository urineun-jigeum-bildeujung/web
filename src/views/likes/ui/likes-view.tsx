// 찜한 상품·최근에 본 상품·자주 산 상품을 탭으로 나눠 본다.
// 와이어프레임 기준(like_001_찜, like_001_최근, like_001_최근 삭제)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { IoClose, IoHeart, IoHeartOutline } from "react-icons/io5";

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
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const TABS = ["liked", "recent", "often"] as const;

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "food", label: "사료" },
  { value: "snack", label: "간식" },
  { value: "supplement", label: "영양제" },
];

type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  category: string;
  /** 자주 산 상품에만 있는 것 */
  boughtCount?: number;
  lastBought?: string;
};

/** API 연동 전까지 화면 확인용 값 */
const MOCK: Record<(typeof TABS)[number], Product[]> = {
  liked: Array.from({ length: 4 }, (_, index) => ({
    id: `l${index}`,
    name: "그레인프리 연어 사료 2kg",
    price: 31200,
    originalPrice: 39000,
    category: ["food", "snack", "supplement", "food"][index],
  })),
  recent: Array.from({ length: 4 }, (_, index) => ({
    id: `r${index}`,
    name: "그레인프리 연어 사료 2kg",
    price: 31200,
    originalPrice: 39000,
    category: "food",
  })),
  often: [
    {
      id: "o0",
      name: "그레인프리 연어 사료 2kg",
      price: 31200,
      originalPrice: 39000,
      category: "food",
      lastBought: "마지막 구매 2주 전",
    },
    {
      id: "o1",
      name: "그레인프리 연어 사료 2kg",
      price: 31200,
      originalPrice: 39000,
      category: "food",
      boughtCount: 4,
    },
    {
      id: "o2",
      name: "그레인프리 연어 사료 2kg",
      price: 31200,
      originalPrice: 39000,
      category: "food",
      boughtCount: 5,
    },
    {
      id: "o3",
      name: "그레인프리 연어 사료 2kg",
      price: 31200,
      originalPrice: 39000,
      category: "food",
    },
  ],
};

/** 목록에서 뺄 때 무엇을 뺀다고 알릴지. 탭마다 부르는 이름이 다르다 */
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
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("liked"));
  const [category, setCategory] = useQueryState("category", parseAsString.withDefault("all"));
  const [items, setItems] = useState(MOCK);
  const [unliked, setUnliked] = useState<string[]>([]);
  const [removing, setRemoving] = useState<Product | null>(null);

  const visible =
    tab === "liked" && category !== "all"
      ? items.liked.filter((item) => item.category === category)
      : items[tab];

  const remove = (id: string) => {
    setItems((prev) => ({ ...prev, [tab]: prev[tab].filter((item) => item.id !== id) }));
    setRemoving(null);
  };

  const toggleLike = (id: string) =>
    setUnliked((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

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

  const heartButton = (product: Product) => {
    const liked = !unliked.includes(product.id);
    return (
      <button
        type="button"
        onClick={() => toggleLike(product.id)}
        aria-pressed={liked}
        aria-label={`${product.name} 찜하기`}
        className="flex size-11 items-center justify-center text-foreground"
      >
        {liked ? (
          <IoHeart aria-hidden className="size-5" />
        ) : (
          <IoHeartOutline aria-hidden className="size-5" />
        )}
      </button>
    );
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader leading="none" title="좋아요" />

      <main className="flex flex-1 flex-col px-4 pb-8">
        <Tabs value={tab} onValueChange={(next) => void setTab(next as (typeof TABS)[number])}>
          <TabsList className="w-full">
            <TabsTrigger value="liked" className="flex-1">
              찜했어요
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex-1">
              최근에 봤어요
            </TabsTrigger>
            <TabsTrigger value="often" className="flex-1">
              자주 샀어요
            </TabsTrigger>
          </TabsList>

          {TABS.map((value) => (
            <TabsContent key={value} value={value} className="flex flex-col gap-4 pt-4">
              {/* 종류로 거르는 것은 찜 탭에만 있다 */}
              {value === "liked" && (
                <FilterChips
                  label="상품 종류 고르기"
                  options={CATEGORIES}
                  value={category}
                  onValueChange={(next) => void setCategory(next)}
                />
              )}

              {visible.length === 0 ? (
                <EmptyState
                  title="아직 담아둔 상품이 없어요"
                  description="마음에 드는 상품에 하트를 눌러보세요."
                  className="flex-1"
                />
              ) : (
                <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
                  {visible.map((product) => (
                    <li key={product.id} className="flex">
                      <ProductGridCard
                        className="flex-1"
                        href={`/products/${product.id}`}
                        name={product.name}
                        price={product.price}
                        originalPrice={product.originalPrice}
                        // 찜 탭은 하트로 빼고, 나머지는 X로 지운다
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
                              <Button variant="outline" className="min-h-11 flex-1 text-xs">
                                장바구니
                              </Button>
                              <Button className="min-h-11 flex-1 text-xs">구매하기</Button>
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
