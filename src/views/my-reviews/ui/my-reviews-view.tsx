// 나의 상품 후기. 작성 가능한 리뷰와 작성한 리뷰를 탭으로 나눈다.
// 와이어프레임 기준(mypa_041_작성가능, mypa_041_작성한)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";

import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";
import { Rating } from "@/shared/ui/rating/rating";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const TABS = ["writable", "written"] as const;

/** API 연동 전까지 화면 확인용 값 */
const MOCK_WRITABLE = Array.from({ length: 4 }, (_, index) => ({
  id: String(index),
  name: "상품명",
  option: "상품 옵션",
  purchasedAt: "26.08.28",
  daysLeft: 30,
}));

const MOCK_WRITTEN = Array.from({ length: 4 }, (_, index) => ({
  id: String(index),
  name: "상품명",
  writtenAt: "26.08.28",
  rating: 4,
  content:
    "후기 더미 - 입맛 까다로운 우리 아이도 잔여 없이 그릇을 싹싹 비울 만큼 기호성이 정말 좋아요! 잘...",
}));

export function MyReviewsView() {
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("writable"));

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="나의 상품 후기" />

      <main className="flex flex-1 flex-col px-4 pb-8">
        <Tabs value={tab} onValueChange={(next) => void setTab(next as (typeof TABS)[number])}>
          <TabsList className="w-full">
            <TabsTrigger value="writable" className="flex-1">
              작성 가능한 리뷰
            </TabsTrigger>
            <TabsTrigger value="written" className="flex-1">
              작성한 리뷰
            </TabsTrigger>
          </TabsList>

          <TabsContent value="writable" className="flex flex-col gap-5 pt-4">
            {MOCK_WRITABLE.length > 0 ? (
              MOCK_WRITABLE.map((item) => (
                <article key={item.id} className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">구매 확정 {item.purchasedAt}</p>
                  <ProductSummary name={item.name} meta={item.option} />
                  <p className="text-right text-xs text-muted-foreground">
                    후기 작성 {item.daysLeft}일 남음
                  </p>
                  <Button variant="outline" className="min-h-11 w-full">
                    후기 남기기
                  </Button>
                </article>
              ))
            ) : (
              <EmptyState
                title="작성할 수 있는 후기가 없어요"
                description="구매를 확정하면 후기를 남길 수 있어요."
              />
            )}
          </TabsContent>

          <TabsContent value="written" className="flex flex-col gap-5 pt-4">
            {MOCK_WRITTEN.length > 0 ? (
              MOCK_WRITTEN.map((item) => (
                <article key={item.id} className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">리뷰 작성 {item.writtenAt}</p>
                  <div className="flex gap-3">
                    <span aria-hidden className="size-16 shrink-0 rounded-lg bg-muted" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                        <Rating value={item.rating} />
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{item.content}</p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="작성한 후기가 없어요" />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
