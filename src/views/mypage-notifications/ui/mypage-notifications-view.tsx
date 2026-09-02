// 알림 목록. 공지와 배송 알림을 한 자리에서 보고 눌러 상세를 연다.
// 와이어프레임 기준(noti_001, noti_001_공지, noti_001_알림)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { PageHeader } from "@/shared/ui/page-header/page-header";

import { NotificationDialog } from "./notification-dialog";
import { NotificationFilter } from "./notification-filter";
import { NotificationRow, type NotificationItem } from "./notification-row";

const FILTERS = ["all", "unread", "read"] as const;

const FILTER_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "unread", label: "새 알림" },
  { value: "read", label: "확인한 알림" },
];

const NOTICE_BODY =
  "보호자님들의 편리한 쇼핑을 위해 결제 시스템이 개편될 예정입니다. 기존보다 결제 단계가 축소되어 카드를 한 번만 등록해 두면 1초 만에 주문을 완료할 수 있습니다.\n(적용 예정일: 9월 중순)";

/** API 연동 전까지 화면 확인용 값 */
const MOCK_ITEMS: NotificationItem[] = [
  {
    id: "1",
    kind: "notice",
    title: "간편결제 및 정기배송 시스템 개편 사전 안내",
    body: NOTICE_BODY,
    date: "26.08.28",
    unread: false,
  },
  {
    id: "2",
    kind: "alarm",
    title: "배송 상태",
    body: "우리 아이 사료가 출발했어요!\n오늘 저녁 8시경 도착할 예정입니다.",
    date: "26.08.28",
    unread: true,
  },
  ...Array.from({ length: 4 }, (_, index) => ({
    id: String(index + 3),
    kind: "notice" as const,
    title: "간편결제 및 정기배송 시스템 개편 사전 안내",
    body: NOTICE_BODY,
    date: "26.08.28",
    unread: false,
  })),
];

export function MypageNotificationsView() {
  const router = useRouter();
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsStringLiteral(FILTERS).withDefault("all"),
  );
  const [items, setItems] = useState(MOCK_ITEMS);
  const [opened, setOpened] = useState<NotificationItem | null>(null);

  const visible = items.filter((item) => {
    if (filter === "unread") return item.unread;
    if (filter === "read") return !item.unread;
    return true;
  });

  const open = (item: NotificationItem) => {
    setOpened(item);
    // 열어 본 것은 확인한 알림으로 옮긴다
    setItems((prev) => prev.map((v) => (v.id === item.id ? { ...v, unread: false } : v)));
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="알림" />

      <main className="flex flex-1 flex-col">
        <div className="px-4 py-3">
          <NotificationFilter
            label="알림 거르기"
            options={FILTER_OPTIONS}
            value={filter}
            onValueChange={(next) => void setFilter(next as (typeof FILTERS)[number])}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title={filter === "unread" ? "새 알림이 없어요" : "확인한 알림이 없어요"}
            description="새로운 소식이 오면 여기에서 알려드릴게요."
            className="flex-1"
          />
        ) : (
          <ul className="flex flex-col">
            {visible.map((item) => (
              <li key={item.id} className="border-t border-border first:border-t-0">
                <NotificationRow item={item} onSelect={() => open(item)} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <NotificationDialog
        item={opened}
        onOpenChange={(next) => !next && setOpened(null)}
        // 배송 알림에서만 주문 내역으로 이어진다
        onConfirm={
          opened?.kind === "alarm"
            ? () => {
                setOpened(null);
                router.push("/mypage/orders");
              }
            : undefined
        }
      />
    </div>
  );
}
