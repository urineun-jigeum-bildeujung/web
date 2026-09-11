// 리뷰 카드 테스트. 아이 프로필이 읽히는지, 도움돼요가 눌린 티가 나는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewCard, type Review } from "./review-card";

const REVIEW: Review = {
  id: "1",
  nickname: "댕댕이짱",
  petProfile: "말티즈 · 8세 · 4kg",
  rating: 4,
  date: "2026. 08. 31",
  photoCount: 3,
  option: "90정 1박스",
  tags: ["사용 3주차", "재구매 2회"],
  content: "확실히 예전보다 계단 오를 때 덜 힘들어해요.",
  likeCount: 32,
};

describe("ReviewCard", () => {
  it("누가 어떤 아이와 썼는지가 함께 보인다", () => {
    render(<ReviewCard review={REVIEW} />);

    expect(screen.getByText("댕댕이짱")).toBeDefined();
    expect(screen.getByText("말티즈 · 8세 · 4kg")).toBeDefined();
    expect(screen.getByText("[옵션] 90정 1박스")).toBeDefined();
  });

  it("도움돼요를 누르면 수가 오르고 눌린 상태가 남는다", () => {
    render(<ReviewCard review={REVIEW} />);

    const like = screen.getByRole("button", { name: /도움이 됐어요/ });
    expect(like.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(like);

    expect(like.getAttribute("aria-pressed")).toBe("true");
    expect(like.textContent).toContain("33");
  });

  // 신고는 되돌리기 어렵다. 누르는 순간 접수되면 안 된다
  it("신고하기를 눌러도 바로 접수되지 않고 확인창이 먼저 뜬다", () => {
    render(<ReviewCard review={REVIEW} />);

    fireEvent.click(screen.getByRole("button", { name: "신고하기" }));

    expect(screen.getByText("이 후기를 신고할까요?")).toBeDefined();
  });

  it("사진이 없으면 사진 자리를 그리지 않는다", () => {
    render(<ReviewCard review={{ ...REVIEW, photoCount: 0 }} />);

    expect(screen.queryByRole("button", { name: /리뷰 사진/ })).toBeNull();
  });

  it("사진을 누를 수 있으면 몇 번째인지 알려준다", () => {
    const onPhotoClick = vi.fn();
    render(<ReviewCard review={REVIEW} onPhotoClick={onPhotoClick} />);

    fireEvent.click(screen.getByRole("button", { name: /2번째 크게 보기/ }));

    expect(onPhotoClick).toHaveBeenCalledWith(1);
  });
});
