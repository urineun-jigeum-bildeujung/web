// 처음 받은 목록은 조용하고, 새 id가 생기면 그것만 최신순으로 알리는지, 알림을 꺼 두면 조용한지 본다.
import { render } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import type { AppNotification } from "@/entities/notification";

const toastPushMessage = vi.fn();
vi.mock("@/shared/lib/app-toast", () => ({
  toastPushMessage: (...args: unknown[]) => toastPushMessage(...args),
}));

const preference = { enabled: true };
vi.mock("@/shared/lib/push/push-preference", () => ({
  readPushEnabled: () => preference.enabled,
  subscribePushPreference: () => () => {},
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
  preference.enabled = true;
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

// 폴링은 종의 점과 알림함을 위해 계속 돌지만, 토스트는 설정의 알림 스위치가 켜져 있을 때만이다(#403)
test("알림을 꺼 두면 새 알림이 와도 띄우지 않고, 켜면 그 뒤에 온 것부터 띄운다", () => {
  preference.enabled = false;
  query.items = [item("1", "하나")];
  const view = render(<NewNotificationToaster />);
  query.items = [item("2", "둘"), item("1", "하나")];
  view.rerender(<NewNotificationToaster />);
  expect(toastPushMessage).not.toHaveBeenCalled();

  // 꺼 둔 동안 온 "둘"은 켜도 쏟아지지 않는다. 기준이 이미 옮겨져 있다
  preference.enabled = true;
  view.rerender(<NewNotificationToaster />);
  expect(toastPushMessage).not.toHaveBeenCalled();

  query.items = [item("3", "셋"), item("2", "둘"), item("1", "하나")];
  view.rerender(<NewNotificationToaster />);
  expect(toastPushMessage).toHaveBeenCalledTimes(1);
  expect(toastPushMessage).toHaveBeenCalledWith("셋", "셋 본문");
});
