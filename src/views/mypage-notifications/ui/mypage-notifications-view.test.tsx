// 서버 응답의 네 상태를 가르는지, 거르기가 URL을 따르는지, 열어 본 알림이 읽음으로 가는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppNotification } from "@/entities/notification";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

// 무엇을 부르고 어떻게 옮기는지는 `entities/notification/api/notifications.test.ts`가 본다. 여기서는 상태만 세운다
const useQueryNotifications = vi.fn();
const markRead = vi.fn();
vi.mock("@/entities/notification", () => ({
  useQueryNotifications: () => useQueryNotifications(),
  useMutateReadNotification: () => ({ markRead }),
}));

import { MypageNotificationsView } from "./mypage-notifications-view";

const ITEMS: AppNotification[] = [
  {
    id: "1",
    type: "NOTICE",
    title: "다가오는 연휴 기간의 택배 배송 일정을 안내해 드려요",
    body: "연휴 전 안전하게 받아보실 수 있도록 미리 주문 마감일을 확인해 주세요",
    isRead: true,
    target: null,
    createdAt: "2026-09-13T00:00:00+00:00",
  },
  {
    id: "2",
    type: "DELIVERY",
    title: "배송 상태",
    body: "우리 아이 사료가 출발했어요!",
    isRead: false,
    target: { type: "ORDER", id: "12" },
    createdAt: "2026-09-02T00:00:00+00:00",
  },
  {
    id: "3",
    type: "NOTICE",
    title: "간편결제 및 정기배송 시스템 개편 사전 안내",
    body: "결제 단계가 축소됩니다",
    isRead: false,
    target: null,
    createdAt: "2026-08-28T00:00:00+00:00",
  },
];

const loaded = (items: AppNotification[] | undefined, error: unknown = null) => ({
  items,
  isLoading: false,
  isRetrying: false,
  error,
  refetch: vi.fn(),
});

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <MypageNotificationsView />
    </NuqsTestingAdapter>,
  );
}

beforeEach(() => {
  push.mockClear();
  markRead.mockClear();
  useQueryNotifications.mockReturnValue(loaded(ITEMS));
});

describe("MypageNotificationsView", () => {
  it("공지와 알림이 한 목록에 모두 보인다", () => {
    renderWith();

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("배송 상태")).toBeDefined();
    expect(screen.getAllByText("공지")).toHaveLength(2);
  });

  it("새 알림으로 거르면 읽지 않은 것만 남는다", () => {
    renderWith("?filter=unread");

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("radio", { name: "새 알림" }).getAttribute("aria-checked")).toBe(
      "true",
    );
  });

  it("읽지 않은 알림은 그 사실이 문장으로도 읽힌다", () => {
    renderWith();

    // 점만 찍으면 스크린 리더가 아무것도 알리지 못한다
    expect(screen.getAllByText("읽지 않음")).toHaveLength(2);
  });

  it("열어 보면 서버에 읽음을 알리고, 이미 읽은 것은 다시 알리지 않는다", () => {
    renderWith();

    fireEvent.click(screen.getByText("배송 상태"));
    expect(markRead).toHaveBeenCalledWith("2");

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    fireEvent.click(screen.getByText(/택배 배송 일정/));
    expect(markRead).toHaveBeenCalledTimes(1);
  });

  it("배송 알림은 배송 확인으로 주문 상세에 가고, 공지에는 이어 가기가 없다", () => {
    renderWith();

    fireEvent.click(screen.getByText("배송 상태"));
    fireEvent.click(screen.getByRole("button", { name: "배송 확인" }));
    expect(push).toHaveBeenCalledWith("/mypage/orders/12");

    fireEvent.click(screen.getByText(/택배 배송 일정/));
    expect(screen.queryByRole("button", { name: /확인|보기/ })).toBeNull();
  });

  it("알림이 없으면 그 사실을 알린다", () => {
    useQueryNotifications.mockReturnValue(loaded([]));
    renderWith();

    expect(screen.getByText("아직 도착한 알림이 없어요")).toBeDefined();
  });

  it("받는 동안은 자리를 잡아 두고, 못 받으면 다시 시도할 수 있다", () => {
    useQueryNotifications.mockReturnValue({ ...loaded(undefined), isLoading: true });
    const first = renderWith();
    expect(screen.getByLabelText("알림을 불러오는 중")).toBeDefined();
    first.unmount();

    const failed = loaded(undefined, new Error("500"));
    useQueryNotifications.mockReturnValue(failed);
    renderWith();
    expect(screen.getByText("알림을 불러오지 못했어요")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(failed.refetch).toHaveBeenCalled();
  });
});
