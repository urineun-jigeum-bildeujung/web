// 처음 받은 목록은 조용하고, 새 id가 생기면 그것만 최신순으로 알리는지 본다.
import { render } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import type { AppNotification } from "@/entities/notification";

const toastPushMessage = vi.fn();
vi.mock("@/shared/lib/app-toast", () => ({
  toastPushMessage: (...args: unknown[]) => toastPushMessage(...args),
}));

const query: { items: AppNotification[] | undefined } = { items: undefined };
vi.mock("@/entities/notification", () => ({
  useQueryNotifications: () => ({ items: query.items }),
}));

import { NewNotificationToaster } from "./new-notification-toaster";

const item = (id: string, title: string): AppNotification => ({
  id,
  type: "NOTICE",
  title,
  body: `${title} 본문`,
  isRead: false,
  target: null,
  createdAt: "2026-09-23T00:00:00+00:00",
});

beforeEach(() => {
  toastPushMessage.mockClear();
});

test("처음 받은 목록은 알리지 않고, 다음에 새 id가 생기면 그것만 알린다", () => {
  query.items = [item("2", "둘"), item("1", "하나")];
  const view = render(<NewNotificationToaster />);
  expect(toastPushMessage).not.toHaveBeenCalled();

  query.items = [item("4", "넷"), item("3", "셋"), item("2", "둘"), item("1", "하나")];
  view.rerender(<NewNotificationToaster />);

  expect(toastPushMessage).toHaveBeenCalledTimes(2);
  expect(toastPushMessage).toHaveBeenNthCalledWith(1, "넷", "넷 본문");
  expect(toastPushMessage).toHaveBeenNthCalledWith(2, "셋", "셋 본문");

  // 같은 목록을 다시 받으면 또 알리지 않는다
  view.rerender(<NewNotificationToaster />);
  expect(toastPushMessage).toHaveBeenCalledTimes(2);
});

test("한꺼번에 많이 오면 최신 셋만 알린다", () => {
  query.items = [item("1", "하나")];
  const view = render(<NewNotificationToaster />);
  query.items = ["6", "5", "4", "3", "2"].map((id) => item(id, id)).concat(item("1", "하나"));
  view.rerender(<NewNotificationToaster />);

  expect(toastPushMessage.mock.calls.map(([title]) => title)).toEqual(["6", "5", "4"]);
});
