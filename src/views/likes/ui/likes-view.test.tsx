// 탭마다 무엇이 붙는지, 카테고리로 거르기가 목록을 줄이는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/likes",
}));

import { LikesView } from "./likes-view";

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <LikesView />
    </NuqsTestingAdapter>,
  );
}

describe("LikesView", () => {
  it("찜 탭에 카테고리 거르기가 있다", () => {
    renderWith();
    expect(screen.getByLabelText("상품 분류")).toBeDefined();
  });

  it("찜 탭에서 사료만 고르면 그것만 남는다", () => {
    renderWith("?tab=liked&category=food");
    // 목업에서 사료는 둘이다
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("주소에 없는 카테고리가 오면 전체로 떨어진다", () => {
    renderWith("?tab=liked&category=legacy");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("최근에 봤어요·자주 샀어요 탭은 눌러도 반응하지 않는다", () => {
    renderWith();

    fireEvent.click(screen.getByRole("tab", { name: "최근에 봤어요" }));
    fireEvent.click(screen.getByRole("tab", { name: "자주 샀어요" }));

    // MVP 범위 밖이라 탭 전환 없이 찜 탭 내용이 그대로 남는다
    expect(screen.getByLabelText("상품 분류")).toBeDefined();
  });

  // disabled는 클릭만 막는다. 주소로 ?tab=recent를 직접 치고 들어오는 건 별도로 막아야
  // 한다(CodeRabbit 지적) — tab 쿼리 파서가 liked 밖의 값을 안 받게 좁혔다
  it("주소로 최근에 봤어요·자주 샀어요에 들어가도 찜 탭으로 떨어진다", () => {
    renderWith("?tab=recent");

    expect(screen.queryByLabelText(/목록에서 빼기/)).toBeNull();
    expect(screen.getByLabelText("상품 분류")).toBeDefined();
  });

  // 최근에 봤어요·자주 샀어요는 탭도 주소도 막혀 있어 그 안의 목록·지우기 로직(코드에는
  // 남아 있다)을 사용자 관점에서 도달할 방법이 없다 — 재활성화 전까지는 직접 테스트하지 않는다

  it("찜을 풀면 확인 없이 바로 목록에서 빠진다", () => {
    renderWith("?tab=liked");

    // 취소 기능이 없어 확인 모달이 뜨면 오히려 방해된다는 판단으로 뺐다(#274 QA 답변)
    fireEvent.click(screen.getAllByLabelText(/찜 풀기/)[0]);

    expect(screen.queryByRole("button", { name: "지우기" })).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  // 빈 상태 시안(2022-158710)엔 칩 줄이 없다. 거른 결과가 빈 것과는 다르다
  it("찜한 상품이 하나도 없으면 카테고리 칩도 감춘다", () => {
    renderWith("?tab=liked");

    for (const button of screen.getAllByLabelText(/찜 풀기/)) {
      fireEvent.click(button);
    }

    expect(screen.queryByLabelText("상품 분류")).toBeNull();
    expect(screen.getByText("아직 담아둔 상품이 없어요")).toBeDefined();
  });

  // 고른 카테고리에만 없는 것과 찜 목록 자체가 빈 것은 다르다(CodeRabbit 지적) — 전자에
  // "아직 담아둔 상품이 없어요"를 그대로 쓰면 다른 칩엔 상품이 있는데도 다 지운 것처럼 읽힌다
  it("찜한 상품은 있는데 고른 카테고리에만 없으면 문구가 다르다", () => {
    renderWith("?tab=liked&category=food");

    // 사료 둘을 다 풀어도 찜 목록엔 간식·영양제 상품이 남는다
    for (const button of screen.getAllByLabelText(/찜 풀기/)) {
      fireEvent.click(button);
    }

    expect(screen.getByText("이 카테고리엔 담아둔 상품이 없어요")).toBeDefined();
    expect(screen.getByLabelText("상품 분류")).toBeDefined();
  });

  // 시안(header, 1585:18342)은 뒤로가기 화살표 + 검색·알림·장바구니고 제목이 없다(#274).
  // 바텀내비 탭 루트라 로고형일 거라 짐작했던 게 틀렸다는 것을 여기서 고정해 둔다
  it("머리말에 뒤로가기가 있고 검색·알림·장바구니로 이동한다", () => {
    renderWith();

    expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeDefined();
    expect(screen.getByRole("link", { name: "검색" }).getAttribute("href")).toBe("/search");
    expect(screen.getByRole("link", { name: "알림" }).getAttribute("href")).toBe(
      "/mypage/notifications",
    );
    expect(screen.getByRole("link", { name: "장바구니" }).getAttribute("href")).toBe("/cart");
  });

  it("하단 이동 줄에서 현재 화면을 알린다", () => {
    renderWith();

    const current = screen.getByRole("link", { name: "좋아요" });
    expect(current.getAttribute("aria-current")).toBe("page");
  });
});
