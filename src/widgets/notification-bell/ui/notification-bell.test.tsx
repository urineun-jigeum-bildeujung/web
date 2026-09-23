// 읽지 않은 것이 있을 때만 점이 붙는지, 링크 이름은 그대로 "알림"인지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const unread = { count: 0 };
vi.mock("@/entities/notification", () => ({
  useQueryUnreadNotificationCount: () => unread.count,
}));

import { NotificationBell } from "./notification-bell";

test("읽지 않은 알림이 없으면 점 없이 알림함으로 가는 링크다", () => {
  unread.count = 0;
  render(<NotificationBell />);

  const link = screen.getByRole("link", { name: "알림" });
  expect(link.getAttribute("href")).toBe("/mypage/notifications");
  expect(screen.queryByText(/읽지 않은 알림/)).toBeNull();
});

test("읽지 않은 알림이 있으면 점이 붙고 개수가 문장으로 읽힌다", () => {
  unread.count = 2;
  render(<NotificationBell />);

  expect(screen.getByText("(읽지 않은 알림 2개)")).toBeDefined();
});
