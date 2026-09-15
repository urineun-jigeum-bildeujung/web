// 목록이 다 보이는지, 거르기가 URL을 따르는지, 열어 본 알림이 확인한 것으로 바뀌는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
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
  it("공지와 알림이 한 목록에 모두 보인다", () => {
    renderWith();

    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.getByText("배송 상태")).toBeDefined();
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

  it("열어 보면 읽지 않음 표시가 사라진다", () => {
    renderWith("?filter=unread");

    fireEvent.click(screen.getByText("배송 상태"));

    expect(screen.getAllByText("읽지 않음")).toHaveLength(1);
  });
});
