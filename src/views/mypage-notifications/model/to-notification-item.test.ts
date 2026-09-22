// 공지·알림 배지 구분과, 이어질 곳이 유형별로 어디인지 본다.
import { expect, test } from "vitest";

import type { AppNotification } from "@/entities/notification";

import { toNotificationAction, toNotificationItem } from "./to-notification-item";

const base: AppNotification = {
  id: "1",
  type: "DELIVERY",
  title: "배송 상태",
  body: "출발했어요",
  isRead: false,
  target: { type: "ORDER", id: "12" },
  createdAt: "2026-09-22T02:29:40+00:00",
};

test("공지만 공지 배지고 나머지는 알림 배지다. 날짜는 시안 꼴이다", () => {
  expect(toNotificationItem(base)).toEqual({
    id: "1",
    kind: "alarm",
    title: "배송 상태",
    body: "출발했어요",
    date: "26.09.22",
    unread: true,
  });
  expect(toNotificationItem({ ...base, type: "NOTICE", isRead: true }).kind).toBe("notice");
  expect(toNotificationItem({ ...base, type: "NOTICE", isRead: true }).unread).toBe(false);
});

test("이어질 곳은 대상 유형이 정하고, 배송 알림의 주문은 배송 확인으로 부른다", () => {
  expect(toNotificationAction(base)).toEqual({ label: "배송 확인", href: "/mypage/orders/12" });
  expect(toNotificationAction({ ...base, type: "STATUS_CHECK" })).toEqual({
    label: "주문 확인",
    href: "/mypage/orders/12",
  });
  expect(toNotificationAction({ ...base, target: { type: "PRODUCT", id: "7" } })).toEqual({
    label: "상품 보기",
    href: "/products/7",
  });
  expect(toNotificationAction({ ...base, target: { type: "TIMEDEAL", id: "3" } })?.href).toBe(
    "/deals",
  );
  expect(toNotificationAction({ ...base, type: "NOTICE", target: null })).toBeNull();
});
