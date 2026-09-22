// 알림 목록. 공지와 배송 알림을 한 자리에서 보고 눌러 상세를 연다.
// UI 시안 기준(noti_011, 1568-81466과 모달 두 장)이다.
//
// 전체·새 알림·확인한 알림으로 거르는 칩은 와이어프레임 수정 때 뺐다가(#137) UI 시안에 다시 있어 되살렸다.
// 목록은 서버(`GET /notifications`)에서 받는다(#354). 거르기는 서버에 필터가 없어 받은 목록을 화면에서
// `isRead`로 가른다 — 한 화면 분량(50건)이라 다시 받는 것보다 낫다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import {
  useMutateReadNotification,
  useQueryNotifications,
  type AppNotification,
} from "@/entities/notification";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { FilterChips } from "@/shared/ui/filter-chips/filter-chips";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Skeleton } from "@/shared/ui/skeleton";

import { toNotificationAction, toNotificationItem } from "../model/to-notification-item";
import { NotificationDialog } from "./notification-dialog";
import { NotificationRow } from "./notification-row";

const FILTER_VALUES = ["all", "unread", "read"] as const;
const FILTER_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "unread", label: "새 알림" },
  { value: "read", label: "확인한 알림" },
] as const;

/** 받는 동안 잡아 둘 자리. 목록 한 줄(배지·제목 줄 + 본문 두 줄)과 같은 높이다 */
function NotificationListSkeleton() {
  return (
    <ul aria-label="알림을 불러오는 중" className="flex flex-col">
      {[0, 1, 2, 3].map((index) => (
        <li key={index} className="flex flex-col gap-2 px-5 py-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-5 flex-1" />
          </div>
          <Skeleton className="h-9 w-full" />
        </li>
      ))}
    </ul>
  );
}

export function MypageNotificationsView() {
  const router = useRouter();
  // 목록에서 상세로 갔다 돌아와도 고른 거르기가 남도록 URL에 둔다
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsStringLiteral(FILTER_VALUES).withDefault("all"),
  );
  const { items, isLoading, isRetrying, error, refetch } = useQueryNotifications();
  const { markRead } = useMutateReadNotification();
  const [opened, setOpened] = useState<AppNotification | null>(null);

  const visible = (items ?? []).filter(
    (item) => filter === "all" || (filter === "unread") === !item.isRead,
  );

  const open = (item: AppNotification) => {
    setOpened(item);
    // 열어 본 것은 확인한 알림으로 옮긴다. 이미 읽은 것은 서버에 다시 알리지 않는다
    if (!item.isRead) markRead(item.id);
  };

  const action = opened ? toNotificationAction(opened) : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="알림" />

      <main className="flex flex-1 flex-col gap-2.5 pt-3 pb-4">
        <div className="px-5">
          <FilterChips
            label="알림 거르기"
            options={FILTER_OPTIONS}
            value={filter}
            onValueChange={(next) => setFilter(next as (typeof FILTER_VALUES)[number])}
          />
        </div>

        {isLoading ? (
          <NotificationListSkeleton />
        ) : error || !items ? (
          <EmptyState
            icon={<Icon name="bell" />}
            title="알림을 불러오지 못했어요"
            description="잠시 후 다시 시도해 주세요"
            className="flex-1"
            action={
              <Button variant="outline" disabled={isRetrying} onClick={() => void refetch()}>
                <LoadingSwap loading={isRetrying} label="알림을 다시 불러오는 중">
                  다시 시도
                </LoadingSwap>
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Icon name="bell" />}
            title={filter === "unread" ? "새 알림이 없어요" : "아직 도착한 알림이 없어요"}
            description="새로운 혜택이나 맞춤 리포트가 도착하면 가장 먼저 알려드릴게요"
            className="flex-1"
          />
        ) : (
          <ul className="flex flex-col">
            {visible.map((item) => (
              <li key={item.id}>
                <NotificationRow item={toNotificationItem(item)} onSelect={() => open(item)} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <NotificationDialog
        item={opened ? toNotificationItem(opened) : null}
        onOpenChange={(next) => !next && setOpened(null)}
        // 갈 곳이 있는 알림(배송·상품·타임딜)만 이어 가기 버튼이 붙는다
        action={
          action && {
            label: action.label,
            onSelect: () => {
              setOpened(null);
              router.push(action.href);
            },
          }
        }
      />
    </div>
  );
}
