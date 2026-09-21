// 타임딜 화면. 진행 중인 딜과 오픈 예정인 딜을 탭으로 나눈다.
// UI 시안 기준(#275, 진행중 1905-32375, 담긴 상태 1905-32403, 오픈예정 1905-32432,
// 빈 화면 1905-32457, 옵션 시트 2544-56035)이다.
//
// 이 화면의 주인공은 상품이 아니라 남은 시간이다. 시간이 다 되면 목록도 함께 사라진다.
//
// 목록은 서버가 조회해 준다(#282). `/app/deals/page.tsx`가 만든 두 Promise(진행중·오픈예정)를
// 각각 `use()`로 풀어 독립된 Suspense 아래 둔다 — 헤더·탭은 그 결과를 기다리지 않는다.
// 백엔드가 딜 묶음(dealId) 개수를 제한하지 않아, 한 상태에 묶음이 여러 개 와도 전부 그린다.

"use client";

import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Suspense, use, useState } from "react";

import {
  ProductOptionSheet,
  type DealItem,
  type OptionSheetProduct,
  type TimeDealList,
} from "@/entities/product";
import {
  formatDisplayDayHour,
  formatDisplayHour,
  toDisplayDayKey,
} from "@/shared/lib/date/display-date";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Countdown } from "@/shared/ui/countdown/countdown";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { formatWon } from "@/shared/ui/price/price";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";
import { showSnackbar } from "@/shared/ui/snackbar/snackbar";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const TABS = ["live", "upcoming"] as const;

const TAB_LABEL = [
  ["live", "진행중"],
  ["upcoming", "오픈 예정"],
] as const;

// 시안(1905-32420·32424·32428)의 배지 색·문구다. 재고 충분(enough)은 배지가 없다
const STOCK_BADGE = {
  low: { label: "품절임박", className: "bg-brand text-brand-foreground" },
  none: { label: "품절", className: "bg-primary text-primary-foreground" },
} as const;

/** 하루. 내일 열리는 딜인지 견줄 때 쓴다 */
const DAY_MS = 86_400_000;

/**
 * "내일 오전 10시"처럼. 오늘·내일이면 날짜 대신 그 말을 쓴다.
 *
 * **date-fns의 `isToday`·`isTomorrow`를 쓰지 않는다.** 그 둘은 브라우저 시간대로 판정해서,
 * 자정 근처에 열리는 딜이 기기에 따라 하루 어긋난다 (#295).
 */
function formatOpenAt(startAt: string) {
  const openDay = toDisplayDayKey(startAt);
  if (!openDay) {
    return null;
  }

  const now = Date.now();
  const nearby =
    openDay === toDisplayDayKey(new Date(now).toISOString())
      ? "오늘"
      : openDay === toDisplayDayKey(new Date(now + DAY_MS).toISOString())
        ? "내일"
        : null;

  return nearby ? `${nearby} ${formatDisplayHour(startAt)}` : formatDisplayDayHour(startAt);
}

/** 결과 영역이 대기 중일 때 자리를 잡는다. 카운트다운 자리 하나 + 카드 3장 자리 */
function DealsSkeleton() {
  return (
    <div className="flex flex-col" role="status" aria-label="타임딜을 불러오는 중">
      <div className="flex flex-col gap-1 px-5 pt-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <ul className="flex flex-col">
        {Array.from({ length: 3 }, (_, index) => (
          <li
            key={index}
            className="flex items-center gap-4 border-b border-border py-5 pr-17 pl-5 last:border-b-0"
          >
            <Skeleton className="size-24 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

type LiveDealsSectionProps = {
  dealsPromise: Promise<TimeDealList>;
  /** 서버가 다시 알려준 게 아니라, 이 화면에서 카운트다운이 다 돼 로컬로만 숨긴 딜 id들 */
  endedDealIds: number[];
  onGroupEnd: (dealId: number) => void;
  addedIds: string[];
  onItemAction: (item: DealItem) => void;
};

/** 진행중 탭 내용. 딜 묶음마다 카운트다운+목록을 반복해 그린다(묶음이 여러 개일 수 있다) */
function LiveDealsSection({
  dealsPromise,
  endedDealIds,
  onGroupEnd,
  addedIds,
  onItemAction,
}: LiveDealsSectionProps) {
  const { groups } = use(dealsPromise);
  const visibleGroups = groups.filter((group) => !endedDealIds.includes(group.dealId));

  if (visibleGroups.length === 0) {
    return (
      <EmptyState
        // 시안(1905-32457)은 44px 아이콘·icon/fill/secondary 색이다(다른 화면의
        // 72px·icon-fill-tertiary 기본값과 다르다). EmptyState가 아이콘을 담는
        // 자리에 `[&>svg]:size-18`을 걸어 두어 className 크기 지정으로는 못 이긴다
        // (부모>svg 결합자가 단일 클래스보다 우선) — 인라인 style로 덮는다
        icon={
          <Icon
            name="clock"
            className="text-icon-fill-secondary"
            style={{ width: 44, height: 44 }}
          />
        }
        title="지금 진행 중인 타임딜이 없어요"
        // 시안은 title/bold_18이 아니라 body/medium_18(18px·500)이다
        titleClassName="text-body-medium-18"
        description={
          <>
            새로운 타임딜이 열리면 알려드릴게요
            <br />
            다른 상품도 둘러보시겠어요?
          </>
        }
        className="flex-1"
      />
    );
  }

  return (
    <>
      {visibleGroups.map((group) => (
        <div key={group.dealId}>
          <div className="flex flex-col px-5 pt-3">
            <Countdown endsAt={new Date(group.endAt)} onEnd={() => onGroupEnd(group.dealId)} />
            <p className="text-sm text-muted-foreground">종료까지 남은 시간</p>
          </div>

          <ul className="flex flex-col">
            {group.items.map((item) => {
              const soldOut = item.stock === "none";
              const id = String(item.timeDealItemId);
              const added = addedIds.includes(id);
              const badge = item.stock === "enough" ? null : STOCK_BADGE[item.stock];

              return (
                <li
                  key={id}
                  className={cn(
                    "relative border-b border-border last:border-b-0",
                    // 시안(1905-32428)은 품절 카드 전체를 45%로 흐리게 한다
                    soldOut && "opacity-45",
                  )}
                >
                  {/* 썸네일·텍스트를 누르면 상품 상세로 간다. 담기 버튼은 링크 안에
                      두면 "링크 속 버튼"이 되어 눌리지 않으므로 링크 바깥의 절대
                      위치 요소로 따로 둔다(product-grid-card의 imageAction과 같은 방식) */}
                  <Link
                    href={`/products/${item.productId}`}
                    className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <ProductSummary
                      name={item.name}
                      imageSize={24}
                      className="gap-4 py-5 pr-17 pl-5"
                      imageBadge={
                        badge && (
                          <span
                            className={cn(
                              "rounded px-1 py-0.5 text-label-medium-12",
                              badge.className,
                            )}
                          >
                            {badge.label}
                          </span>
                        )
                      }
                      meta={
                        <div className="flex flex-col items-start">
                          {item.discountRate > 0 && (
                            <p className="text-label-regular-13 text-text-body-unselect line-through">
                              {formatWon(item.originalPrice)}
                            </p>
                          )}
                          <div className="flex items-center gap-1">
                            {item.discountRate > 0 && (
                              <span className="text-label-regular-13 font-bold text-destructive">
                                {item.discountRate}%
                              </span>
                            )}
                            <span className="text-title-bold-18 text-foreground">
                              {formatWon(item.price)}
                            </span>
                          </div>
                          {/* unitLabel이 실제로 null일 수 있다(정규화 단위가 없는 상품) —
                              없으면 이 줄 자체를 안 그린다 */}
                          {item.unitLabel && (
                            <p className="text-label-medium-11 text-text-body-unselect">
                              {item.unitLabel} {formatWon(item.unitAmount)}
                            </p>
                          )}
                        </div>
                      }
                    />
                  </Link>
                  <button
                    type="button"
                    disabled={soldOut}
                    aria-label={
                      soldOut
                        ? `${item.name} 품절`
                        : added
                          ? `${item.name} 장바구니에서 빼기`
                          : `${item.name} 장바구니에 담기`
                    }
                    onClick={() => onItemAction(item)}
                    // 시안(1905-32420·32424·32428)은 테두리 없는 6px 모서리
                    // 사각형이다. 담을 수 있음/담김은 배경이 아예 없고, 품절만
                    // disable 회색(surface-disable)이 채워진다. 링크 위에 겹쳐야 해서
                    // absolute로 뺐다(product-grid-card의 imageAction과 같은 방식)
                    className={cn(
                      "absolute top-1/2 right-5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors",
                      "after:absolute after:-inset-1.5",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      soldOut ? "bg-surface-disable" : "hover:bg-muted",
                    )}
                  >
                    {added ? (
                      <Icon name="check" aria-hidden className="size-6 text-icon-fill-default" />
                    ) : (
                      <Icon name="cart" aria-hidden className="size-6 text-icon-fill-secondary" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

type UpcomingDealsSectionProps = {
  dealsPromise: Promise<TimeDealList>;
  notifiedDealIds: number[];
  onToggleNotify: (dealId: number) => void;
};

/** 오픈예정 탭 내용. 딜 묶음마다 오픈 카운트다운+목록+알림 버튼을 반복해 그린다 */
function UpcomingDealsSection({
  dealsPromise,
  notifiedDealIds,
  onToggleNotify,
}: UpcomingDealsSectionProps) {
  const { groups } = use(dealsPromise);

  if (groups.length === 0) {
    return (
      // Figma에 오픈예정 전용 빈 화면이 따로 없어, 진행중 탭 빈 화면(1905-32457)과
      // 같은 아이콘·색·크기·간격·설명 문구를 그대로 재사용하고 제목만 이 탭 문맥에
      // 맞춰 바꿨다 — 근거는 deals/README.md의 "아직 확인이 끝나지 않은 것"을 본다
      <EmptyState
        icon={
          <Icon
            name="clock"
            className="text-icon-fill-secondary"
            style={{ width: 44, height: 44 }}
          />
        }
        title="오픈 예정인 타임딜이 없어요"
        titleClassName="text-body-medium-18"
        description={
          <>
            새로운 타임딜이 열리면 알려드릴게요
            <br />
            다른 상품도 둘러보시겠어요?
          </>
        }
        className="flex-1"
      />
    );
  }

  return (
    <>
      {groups.map((group) => {
        const notified = notifiedDealIds.includes(group.dealId);
        const openAt = new Date(group.startAt);
        const openLabel = formatOpenAt(group.startAt);

        return (
          <div key={group.dealId}>
            <div className="flex flex-col px-5 pt-3">
              {/* 신청해도 나중에 취소할 수 있어 남은 시간은 계속 보여준다. 버튼 문구만 바뀐다 */}
              <Countdown
                endsAt={openAt}
                fallback={<p className="text-2xl font-bold text-foreground">곧 열려요</p>}
              />
              {openLabel && <p className="text-sm text-muted-foreground">{openLabel}에 봬요!</p>}
            </div>

            <ul className="flex flex-col">
              {group.items.map((item) => (
                <li key={item.timeDealItemId} className="border-b border-border last:border-b-0">
                  <ProductSummary
                    name={item.name}
                    imageSize={24}
                    className="gap-4 p-5"
                    meta={
                      <span className="flex flex-col gap-0.5">
                        <span className="text-title-bold-18 text-brand">
                          예정 {item.discountRate}%
                        </span>
                        <span className="text-label-medium-11 text-text-body-unselect">
                          {openLabel} 오픈
                        </span>
                      </span>
                    }
                    // 시안(1905-32448)은 이 자리(action_button)가 아예 없다 — 장식용
                    // 가방 아이콘을 지운다
                  />
                </li>
              ))}
            </ul>

            <div className="px-5 py-4">
              {/* 다시 누르면 신청을 취소한다. 이 "신청됨" 상태 자체의 시안은 아직 개별
                  확인 전이다(로컬 QA 기록) */}
              {notified ? (
                // 신청 전 버튼과 높이·모서리·글자 스타일·눌림 효과가 전부 같아야 해서
                // 직접 만든 button 대신 같은 공용 Button을 쓴다(variant만 바꾼다)
                <Button
                  variant="default"
                  onClick={() => onToggleNotify(group.dealId)}
                  aria-label="오픈 알림 신청 취소하기"
                  className="min-h-11 text-label-bold-14"
                >
                  <Icon name="bell" aria-hidden className="size-6" />
                  오픈 알림 신청됨
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => onToggleNotify(group.dealId)}
                  className="min-h-11 text-label-bold-14"
                >
                  <Icon name="bell" aria-hidden className="size-6 text-icon-stroke-tertiary" />
                  오픈 알림 신청하기
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

type DealsViewProps = {
  liveDealsPromise: Promise<TimeDealList>;
  upcomingDealsPromise: Promise<TimeDealList>;
};

export function DealsView({ liveDealsPromise, upcomingDealsPromise }: DealsViewProps) {
  // nuqs 기본은 replace라 뒤로가기가 탭 전환을 건너뛰고 화면을 떠난다.
  // 고른 탭에 따라 보이는 것이 통째로 달라지므로 되돌아올 수 있어야 한다
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TABS).withDefault("live").withOptions({ history: "push" }),
  );

  // 서버가 다시 알려준 게 아니라 카운트다운이 다 돼 로컬에서만 숨긴 딜들이다.
  // 실제로 그 딜이 끝났는지는 다음에 이 화면을 다시 열 때 서버 조회로 확인된다
  const [endedDealIds, setEndedDealIds] = useState<number[]>([]);
  const [notifiedDealIds, setNotifiedDealIds] = useState<number[]>([]);
  const [picked, setPicked] = useState<OptionSheetProduct | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  // QA가 빈 상태를 바로 보고 싶을 때 쓰는 개발용 스위치. 실제 딜 종료와는 별개다
  const [devForceEmpty, setDevForceEmpty] = useState(false);

  const addToCart = (productId: string) => {
    // 실제 장바구니 담기(mutation)는 이번 이슈(#282) 범위 밖이다 — 목업 그대로 로컬 상태만 바꾼다
    setAddedIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
    setPicked(null);
    // 시안(1905-32431 snackbar)은 수량 설명 없이 한 줄이다
    showSnackbar("장바구니에 담겼어요");
  };

  const handleItemAction = (item: DealItem) => {
    const id = String(item.timeDealItemId);
    if (addedIds.includes(id)) {
      setAddedIds((prev) => prev.filter((v) => v !== id));
      return;
    }
    setPicked({
      id,
      name: item.name,
      price: item.price,
      // 실제 API에 옵션 구성("1.5kg (기본 구성)" 같은) 개념 자체가 없다. 있는 데이터로
      // 지어내지 않고 빈 문자열로 둔다 — README의 "아직 확인이 끝나지 않은 것"에 남김
      optionLabel: "",
      unitLabel: item.unitLabel ?? undefined,
      unitAmount: item.unitAmount,
    });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="타임딜"
        right={
          // 시안(1905-32416)의 공용 header 아이콘 방식이다(product-detail·product-compare와 동일).
          // 장바구니 개수 배지는 실제 연동 전까지 생략한다(로컬 QA 기록)
          <>
            <Link
              href="/search"
              aria-label="검색"
              className="relative flex size-7 items-center justify-center after:absolute after:-inset-2"
            >
              <Icon name="search" className="size-7" />
            </Link>
            <Link
              href="/cart"
              aria-label="장바구니"
              className="relative flex size-7 items-center justify-center after:absolute after:-inset-2"
            >
              <Icon name="cart" className="size-7" />
            </Link>
          </>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(next) => void setTab(next as (typeof TABS)[number])}
        className="flex-1 gap-0"
      >
        {/* 시안(1905-32413)은 탭 줄 전체를 가르는 회색 선이 없다 — 고른 탭 글자 바로
            아래에만 1px 밑줄이 붙는다. 나머지는 배경과 같은 흰 바탕이다 */}
        <TabsList variant="line" className="h-10 w-full justify-start gap-0 px-5">
          {TAB_LABEL.map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="relative h-8 flex-none px-2 text-label-medium-14 text-text-body-tertiary before:absolute before:inset-x-0 before:-inset-y-1.5 after:bg-border-strong group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-px data-active:text-label-bold-14 data-active:text-foreground"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="live" className="flex flex-col">
          {devForceEmpty ? (
            <EmptyState
              icon={
                <Icon
                  name="clock"
                  className="text-icon-fill-secondary"
                  style={{ width: 44, height: 44 }}
                />
              }
              title="지금 진행 중인 타임딜이 없어요"
              titleClassName="text-body-medium-18"
              description={
                <>
                  새로운 타임딜이 열리면 알려드릴게요
                  <br />
                  다른 상품도 둘러보시겠어요?
                </>
              }
              className="flex-1"
            />
          ) : (
            <Suspense fallback={<DealsSkeleton />}>
              <LiveDealsSection
                dealsPromise={liveDealsPromise}
                endedDealIds={endedDealIds}
                onGroupEnd={(dealId) => setEndedDealIds((prev) => [...prev, dealId])}
                addedIds={addedIds}
                onItemAction={handleItemAction}
              />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="flex flex-col">
          <Suspense fallback={<DealsSkeleton />}>
            <UpcomingDealsSection
              dealsPromise={upcomingDealsPromise}
              notifiedDealIds={notifiedDealIds}
              onToggleNotify={(dealId) =>
                setNotifiedDealIds((prev) =>
                  prev.includes(dealId) ? prev.filter((v) => v !== dealId) : [...prev, dealId],
                )
              }
            />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* 실제 진행 딜이 몇 시간씩 남아 빈 상태를 보려면 오래 기다려야 할 수 있다.
          QA가 두 상태를 바로 오가며 볼 수 있게 둔 개발용 버튼이다 — 시안엔 없고
          운영 빌드에는 나가지 않는다 */}
      {process.env.NODE_ENV !== "production" && (
        <div className="border-t border-border p-4 text-center">
          <button
            type="button"
            onClick={() => setDevForceEmpty((prev) => !prev)}
            className="text-label-medium-12 text-text-body-tertiary underline"
          >
            [개발용] {devForceEmpty ? "타임딜 상품 있는 상태 보기" : "타임딜 빈 상태 보기"}
          </button>
        </div>
      )}

      <ProductOptionSheet
        product={picked}
        onOpenChange={(open) => !open && setPicked(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
}
