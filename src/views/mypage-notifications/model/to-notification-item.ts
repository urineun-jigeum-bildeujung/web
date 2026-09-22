// 서버 알림 한 건을 목록 줄·상세 모달이 그리는 모양으로 옮기고, 눌렀을 때 갈 곳을 정한다.
// 라우트를 아는 것은 화면이라 entities가 아니라 여기서 정한다.

import type { AppNotification } from "@/entities/notification";
import { formatDisplayDate } from "@/shared/lib/date/display-date";

import type { NotificationItem } from "../ui/notification-row";

/** 상세 모달의 이어 가기 버튼. 갈 곳이 없는 알림(공지 등)은 `null` */
export type NotificationAction = {
  label: string;
  href: string;
};

/** 시안의 배지는 공지·알림 둘이다. 공지만 공지, 배송·타임딜·상태 체크·추천·재입고는 모두 알림 */
export function toNotificationItem(notification: AppNotification): NotificationItem {
  return {
    id: notification.id,
    kind: notification.type === "NOTICE" ? "notice" : "alarm",
    title: notification.title,
    body: notification.body,
    // 읽을 수 없는 시각이면 날짜 자리를 비운다. 이상한 값을 보이는 것보다 낫다
    date: formatDisplayDate(notification.createdAt) ?? "",
    unread: !notification.isRead,
  };
}

export function toNotificationAction(notification: AppNotification): NotificationAction | null {
  const { target, type } = notification;
  if (!target) return null;
  switch (target.type) {
    case "ORDER":
      return {
        label: type === "DELIVERY" ? "배송 확인" : "주문 확인",
        href: `/mypage/orders/${target.id}`,
      };
    case "PRODUCT":
      return { label: "상품 보기", href: `/products/${target.id}` };
    case "TIMEDEAL":
      // 타임딜 단건 화면이 없어 목록으로 간다
      return { label: "타임딜 보기", href: "/deals" };
  }
}
