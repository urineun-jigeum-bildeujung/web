// 탭에 따라 화면이 통째로 바뀌는지, 상태 체크가 무엇을 약속하는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
}));

import { HomeView } from "./home-view";

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <HomeView />
    </NuqsTestingAdapter>,
  );
}

describe("HomeView", () => {
  it("전체 탭은 골라주는 화면이다", () => {
    renderWith();

    expect(screen.getByText(/AI가 골라주는/)).toBeDefined();
    expect(screen.getByText(/최근에 구매한 상품/)).toBeDefined();
  });

  it("종류를 고르면 상품 목록으로 바뀐다", () => {
    renderWith("?category=food");

    // 큐레이션 자리가 사라지고 정렬이 나온다
    expect(screen.queryByText(/AI가 골라주는/)).toBeNull();
    expect(screen.getByLabelText("정렬")).toBeDefined();
  });

  it("아이 이름이 화면에 보인다", () => {
    renderWith();

    // 사진만으로는 어느 아이인지 알 수 없다
    expect(screen.getByText("소리")).toBeDefined();
  });

  it("반응을 남기면 어디에 쓰이는지 알린다", () => {
    renderWith();

    fireEvent.click(screen.getAllByRole("button", { name: /반응 남기기/ })[0]);
    fireEvent.click(screen.getByRole("radio", { name: "잘 맞았어요" }));
    fireEvent.click(screen.getByRole("button", { name: "등록하기" }));

    // 남긴 반응이 추천으로 되돌아간다는 것이 이 서비스의 약속이다
    expect(screen.getByText(/다음 추천 적합도에 반영할게요/)).toBeDefined();
  });

  it("아직 답할 수 없다는 것도 답으로 받는다", () => {
    renderWith();

    fireEvent.click(screen.getAllByRole("button", { name: /반응 남기기/ })[0]);
    const submit = screen.getByRole("button", { name: "등록하기" });
    expect(submit).toHaveProperty("disabled", true);

    fireEvent.click(screen.getByLabelText(/아직 판단하기에는 일러요/));
    expect(submit).toHaveProperty("disabled", false);
  });
});
