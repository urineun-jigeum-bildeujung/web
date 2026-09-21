// 나의 상품 후기. 작성 가능한 리뷰와 작성한 리뷰를 탭으로 나눈다.
// UI 시안 기준(mypa_041_작성가능 1117-7739, mypa_041_작성한 1117-8369)이다.
// 탭은 알약 세그먼트(48px 트랙·흰 알약), 항목은 구매일·사진 64·이름 title/bold_16이다.
//
// 작성한 리뷰는 서버에서 받는다. 작성 가능한 리뷰는 그 목록 API가 아직 없어 라우트가 목데이터를 넘긴다(#291).

"use client";

import Image from "next/image";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { useQueryMyReviews, type MyReviewItem } from "@/entities/review";
import { formatDisplayDate } from "@/shared/lib/date/display-date";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Rating } from "@/shared/ui/rating/rating";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import type { WritableReview } from "../model/mock-reviews";

const TABS = ["writable", "written"] as const;

type MyReviewsViewProps = {
  /** 아직 후기를 안 쓴 구매 항목 */
  writable: WritableReview[];
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

/**
 * 작성일 한 줄. 응답의 `YYYY-MM-DD`를 시안의 `26.07.20` 꼴로 그린다.
 *
 * 읽을 수 없는 값이면 라벨까지 통째로 비운다 — `작성일`만 남으면 값을 잃은 것이 아니라
 * 빈 날짜가 있는 것처럼 보인다.
 */
function WrittenDate({ isoDate }: { isoDate: string }) {
  const date = formatDisplayDate(isoDate);
  if (!date) {
    return null;
  }

  return <p className="text-caption-regular-13 text-text-body-secondary">작성일 {date}</p>;
}

/** 받는 동안 잡아 둘 자리. 목록 한 줄과 같은 높이(날짜 한 줄 + 68px)다 */
function WrittenSkeleton() {
  return (
    <ul aria-label="작성한 리뷰를 불러오는 중" className="flex flex-col gap-5">
      {[0, 1, 2].map((index) => (
        <li key={index} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <div className="flex h-17 items-center gap-3">
            <Skeleton className="size-16 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function WrittenList({ items }: { items: MyReviewItem[] }) {
  return items.map((item) => (
    <Link
      key={item.id}
      href={`/mypage/reviews/${item.id}`}
      className="flex flex-col gap-3 rounded-lg transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {/* 응답에 구매일이 없다. 시안의 그 자리에 작성일을 보인다 */}
      <WrittenDate isoDate={item.createdAt} />
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
  ));
}

/** 작성한 탭. 받는 중 · 실패 · 비어 있음 · 목록을 가른다 */
function WrittenTab() {
  const { reviews, isLoading, isRetrying, error, refetch } = useQueryMyReviews();

  // 처음 그릴 때라 Skeleton이 자리를 잡는다
  if (isLoading) return <WrittenSkeleton />;
  if (error || !reviews) {
    return (
      <EmptyState
        icon={<Icon name="review" />}
        title="후기를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요"
        action={
          <Button variant="outline" disabled={isRetrying} onClick={() => void refetch()}>
            <LoadingSwap loading={isRetrying} label="후기를 다시 불러오는 중">
              다시 시도
            </LoadingSwap>
          </Button>
        }
      />
    );
  }
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="review" />}
        title="아직 작성한 후기가 없어요"
        description="다른 보호자들을 위해 아이의 경험을 나눠주세요"
      />
    );
  }
  return <WrittenList items={reviews} />;
}

export function MyReviewsView({ writable }: MyReviewsViewProps) {
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
                    <Link href={`/mypage/reviews/write?productId=${item.id}`}>후기 남기기</Link>
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

          {/* 탭을 열 때만 받는다. 작성 가능 탭에서 머무는 동안 안 쓰는 목록을 부르지 않는다 */}
          <TabsContent value="written" className="flex flex-col gap-5 pt-5">
            {tab === "written" && <WrittenTab />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
