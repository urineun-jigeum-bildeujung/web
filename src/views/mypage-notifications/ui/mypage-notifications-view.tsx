// 알림 목록. 공지와 배송 알림을 한 자리에서 보고 눌러 상세를 연다.
// UI 시안 기준(noti_011, 1568-81466과 모달 두 장)이다.
//
// 전체·새 알림·확인한 알림으로 거르는 칩은 와이어프레임 수정 때 뺐다가(#137) UI 시안에 다시 있어 되살렸다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { FilterChips } from "@/shared/ui/filter-chips/filter-chips";
import { PageHeader } from "@/shared/ui/page-header/page-header";

import { NotificationDialog } from "./notification-dialog";
import { NotificationRow, type NotificationItem } from "./notification-row";
import { Icon } from "@/shared/ui/icon/icon";

const FILTER_VALUES = ["all", "unread", "read"] as const;
const FILTER_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "unread", label: "새 알림" },
  { value: "read", label: "확인한 알림" },
] as const;

const NOTICE_BODY =
  "보호자님들의 편리한 쇼핑을 위해 결제 시스템이 개편될 예정입니다. 기존보다 결제 단계가 축소되어 카드를 한 번만 등록해 두면 1초 만에 주문을 완료할 수 있습니다. 또한, 설정하신 사료 급여 주기에 맞춰 자동으로 배송되는 '스마트 정기배송' 혜택이 강화되니 많은 기대 부탁드립니다. (적용 예정일: 9월 중순)";

/** API 연동 전까지 화면 확인용 값. 시안(1568-81466)의 여덟 줄이다 */
const MOCK_ITEMS: NotificationItem[] = [
  {
    id: "1",
    kind: "notice",
    title: "다가오는 연휴 기간의 택배 배송 일정을 안내해 드려요",
    body: "연휴 전 안전하게 받아보실 수 있도록 미리 주문 마감일을 확인해 주세요",
    date: "26.09.13",
    unread: false,
  },
  {
    id: "2",
    kind: "alarm",
    title: "배송 상태",
    body: "우리 아이 사료가 출발했어요!\n오늘 저녁 8시경 도착할 예정입니다.",
    date: "26.09.02",
    unread: true,
  },
  {
    id: "3",
    kind: "notice",
    title: "간편결제 및 정기배송 시스템 개편 사전 안내",
    body: NOTICE_BODY,
    date: "26.08.28",
    unread: true,
  },
  {
    id: "4",
    kind: "alarm",
    title: "새로 바꾼 사료는 보리 입맛에 잘 맞았나요",
    body: "솔직한 리뷰를 남겨주시면 다음 식단 추천을 훨씬 더 정확하게 해드릴 수 있어요",
    date: "26.08.28",
    unread: false,
  },
  {
    id: "5",
    kind: "notice",
    title: "새로운 맞춤 식단 분석 리포트가 추가되었어요",
    body: "우리 아이의 건강 상태를 더 정확하게 확인할 수 있게 분석 항목을 늘렸어요",
    date: "26.08.28",
    unread: false,
  },
  {
    id: "6",
    kind: "alarm",
    title: "코코를 위한 새로운 알러지 분석 리포트가 도착했어요",
    body: "최근 기록해 주신 식단을 바탕으로 주의해야 할 성분을 꼼꼼하게 정리했어요",
    date: "26.08.28",
    unread: false,
  },
  {
    id: "7",
    kind: "alarm",
    title: "장바구니에 담아둔 간식을 잊지 않으셨나요",
    body: "수량이 얼마 남지 않은 인기 상품이 보호자님의 결제를 기다리고 있어요",
    date: "26.08.28",
    unread: false,
  },
  {
    id: "8",
    kind: "notice",
    title: "무료 배송을 위한 최소 주문 금액이 변경되었어요",
    body: "더 나은 배송 서비스를 위해 다음 달부터 최소 주문 금액 기준이 3만 원으로 변경돼요",
    date: "26.08.28",
    unread: false,
  },
];

export function MypageNotificationsView() {
  const router = useRouter();
  // 목록에서 상세로 갔다 돌아와도 고른 거르기가 남도록 URL에 둔다
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsStringLiteral(FILTER_VALUES).withDefault("all"),
  );
  const [items, setItems] = useState(MOCK_ITEMS);
  const [opened, setOpened] = useState<NotificationItem | null>(null);

  const visible = items.filter((item) => filter === "all" || (filter === "unread") === item.unread);

  const open = (item: NotificationItem) => {
    setOpened(item);
    // 열어 본 것은 확인한 알림으로 옮긴다
    setItems((prev) => prev.map((v) => (v.id === item.id ? { ...v, unread: false } : v)));
  };

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

        {visible.length === 0 ? (
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
