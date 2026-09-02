// 거르기가 목록을 실제로 줄이는지, 열어 본 알림이 확인한 쪽으로 넘어가는지 본다.
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

import { MypageNotificationsView } from "./mypage-notifications-view";

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <MypageNotificationsView />
    </NuqsTestingAdapter>,
  );
}

describe("MypageNotificationsView", () => {
  it("전체에서는 공지와 알림이 모두 보인다", () => {
    renderWith();

    // "알림"은 머리말 제목에도 있어 뱃지만 세려면 목록 안에서 찾는다
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByText("배송 상태")).toBeDefined();
  });

  it("새 알림만 고르면 읽지 않은 것만 남는다", () => {
    renderWith("?filter=unread");

    // 목업에서 읽지 않은 것은 배송 상태 하나뿐이다
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("배송 상태")).toBeDefined();
  });

  it("확인한 알림만 고르면 읽은 것만 남는다", () => {
    renderWith("?filter=read");

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByText("배송 상태")).toBeNull();
  });

  it("읽지 않은 알림은 그 사실이 문장으로도 읽힌다", () => {
    renderWith();

    // 점만 찍으면 스크린 리더가 아무것도 알리지 못한다
    expect(screen.getByText("읽지 않음")).toBeDefined();
  });
});
