// 알림 목록을 화면 모양으로 옮기는 것과 읽음 처리가 어디로 가는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import { getNotifications, markNotificationRead } from "./notifications";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("목록을 받아 이어질 곳을 하나로 묶고, 없으면 null로 둔다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      content: [
        {
          notificationId: 3,
          type: "DELIVERY",
          title: "배송 상태",
          body: "출발했어요",
          isRead: false,
          targetType: "ORDER",
          targetId: "12",
          createdAt: "2026-09-22T02:29:40+00:00",
        },
        {
          notificationId: 1,
          type: "NOTICE",
          title: "공지",
          body: "내용",
          isRead: true,
          targetType: null,
          targetId: null,
          createdAt: "2026-09-20T00:00:00+00:00",
        },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const items = await getNotifications({ page: 0, size: 50 });

  expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/notifications?page=0&size=50");
  expect(items).toEqual([
    {
      id: "3",
      type: "DELIVERY",
      title: "배송 상태",
      body: "출발했어요",
      isRead: false,
      target: { type: "ORDER", id: "12" },
      createdAt: "2026-09-22T02:29:40+00:00",
    },
    {
      id: "1",
      type: "NOTICE",
      title: "공지",
      body: "내용",
      isRead: true,
      target: null,
      createdAt: "2026-09-20T00:00:00+00:00",
    },
  ]);
});

test("읽음 처리는 그 알림의 read 주소로 PATCH한다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  await markNotificationRead("3");

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/notifications/3/read");
  expect(init.method).toBe("PATCH");
});
