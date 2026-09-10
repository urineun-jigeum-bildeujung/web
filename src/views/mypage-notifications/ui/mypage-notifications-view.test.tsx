// 목록이 다 보이는지, 열어 본 알림이 확인한 것으로 바뀌는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

import { MypageNotificationsView } from "./mypage-notifications-view";

describe("MypageNotificationsView", () => {
  // 거르기는 2026-09-09 시안 수정에서 빠졌다(#137). 목록은 한 벌로만 보인다
  it("공지와 알림이 한 목록에 모두 보인다", () => {
    render(<MypageNotificationsView />);

    // "알림"은 머리말 제목에도 있어 목록 안에서 센다
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByText("배송 상태")).toBeDefined();
  });

  it("읽지 않은 알림은 그 사실이 문장으로도 읽힌다", () => {
    render(<MypageNotificationsView />);

    // 점만 찍으면 스크린 리더가 아무것도 알리지 못한다
    expect(screen.getByText("읽지 않음")).toBeDefined();
  });

  it("열어 보면 읽지 않음 표시가 사라진다", () => {
    render(<MypageNotificationsView />);

    fireEvent.click(screen.getByText("배송 상태"));

    expect(screen.queryByText("읽지 않음")).toBeNull();
  });
});
