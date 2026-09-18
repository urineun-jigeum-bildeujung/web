// 나의 상품 후기. 작성 가능한 리뷰와 작성한 리뷰를 탭으로 나눈다.
// UI 시안 기준(mypa_041_작성가능 1117-7739, mypa_041_작성한 1117-8369)이다.
// 탭은 알약 세그먼트(48px 트랙·흰 알약), 항목은 구매일·사진 64·이름 title/bold_16이다.

"use client";

import Image from "next/image";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Rating } from "@/shared/ui/rating/rating";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import type { WritableReview, WrittenReview } from "../model/mock-reviews";
import { Icon } from "@/shared/ui/icon/icon";

const TABS = ["writable", "written"] as const;

type MyReviewsViewProps = {
  /** 아직 후기를 안 쓴 구매 항목 */
  writable: WritableReview[];
  /** 이미 쓴 후기 */
  written: WrittenReview[];
};

/** 시안 segment_control의 알약. 고른 쪽만 흰 바탕에 검은 글자다 */
const TAB_CLASS =
  "h-10 rounded-full text-label-bold-16 text-text-body-unselect data-active:bg-background data-active:text-foreground data-active:shadow-none";

/** 상품 사진 64px. 없으면 회색 자리만 남는다 */
function Thumbnail({ src }: { src?: string }) {
  return (
    <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-disable">
      {src && <Image src={src} alt="" fill sizes="64px" className="object-cover" />}
    </span>
  );
}

export function MyReviewsView({ writable, written }: MyReviewsViewProps) {
  const [tab, setTab] = useQueryState(
    "tab",
    // 작성 가능·작성한이 서로 다른 목록이라 뒤로가기로 되돌아와야 한다
    parseAsStringLiteral(TABS).withDefault("writable").withOptions({ history: "push" }),
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="나의 상품 후기" />

      <main className="flex flex-1 flex-col px-5 pt-2 pb-8">
        <Tabs value={tab} onValueChange={(next) => void setTab(next as (typeof TABS)[number])}>
          {/* 시안의 트랙은 목록보다 좌우 4px 안쪽이다 */}
          <TabsList className="mx-1 flex w-auto rounded-full bg-surface-disable p-1 group-data-horizontal/tabs:h-12">
            <TabsTrigger value="writable" className={TAB_CLASS}>
              작성 가능한 리뷰
            </TabsTrigger>
            <TabsTrigger value="written" className={TAB_CLASS}>
              작성한 리뷰
            </TabsTrigger>
          </TabsList>

          <TabsContent value="writable" className="flex flex-col gap-2 pt-5">
            {writable.length > 0 ? (
              writable.map((item) => (
                <article key={item.id} className="flex flex-col gap-3">
                  <p className="text-caption-regular-13 text-text-body-secondary">
                    구매일 {item.purchasedAt}
                  </p>
                  <div className="flex items-center gap-3">
                    <Thumbnail src={item.imageUrl} />
                    <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
                      <p className="truncate text-title-bold-16 text-foreground">{item.name}</p>
                      <p className="text-right text-caption-regular-13 text-text-body-secondary">
                        후기 작성 {item.daysLeft}일 남음
                      </p>
                    </div>
                  </div>
                  {/* 시안의 action_button. 40px에 굵은 14px */}
                  <Button asChild variant="outline" className="h-10 w-full text-label-bold-14">
                    <Link href={`/mypage/reviews/write?orderItemId=${item.id}`}>후기 남기기</Link>
                  </Button>
                </article>
              ))
            ) : (
              <EmptyState
                icon={<Icon name="pencil" />}
                title="지금은 작성할 수 있는 후기가 없어요"
                description="구매하신 상품이 도착하면 솔직한 후기를 남겨주세요"
              />
            )}
          </TabsContent>

          <TabsContent value="written" className="flex flex-col gap-5 pt-5">
            {written.length > 0 ? (
              written.map((item) => (
                <Link
                  key={item.id}
                  href={`/mypage/reviews/${item.id}`}
                  className="flex flex-col gap-3 rounded-lg transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <p className="text-caption-regular-13 text-text-body-secondary">
                    구매일 {item.purchasedAt}
                  </p>
                  <div className="flex h-17 items-center gap-3">
                    <Thumbnail src={item.imageUrl} />
                    <div className="flex h-full min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-title-bold-16 text-foreground">
                          {item.name}
                        </p>
                        <Rating value={item.rating} size="md" />
                      </div>
                      <p className="line-clamp-2 text-caption-regular-13 text-text-body-secondary">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                icon={<Icon name="review" />}
                title="아직 작성한 후기가 없어요"
                description="다른 보호자들을 위해 아이의 경험을 나눠주세요"
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
