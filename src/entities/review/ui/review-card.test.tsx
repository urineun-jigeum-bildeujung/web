// 리뷰 카드 테스트. 아이 정보가 읽히는지, 신고·도움돼요가 로그인을 먼저 확인하는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { clearTokens, saveTokens } from "@/shared/api/token-store";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError } from "@/shared/lib/app-toast";

import type { Review, ReviewPet } from "../model/review";

import { ReviewCard } from "./review-card";

vi.mock("@/shared/lib/app-toast", () => ({ toastAppError: vi.fn() }));

/** 도움돼요를 눌렀을 때 화면이 받는 것. 누른 뒤의 상태가 온다 */
const onToggleLike = vi.fn();

afterEach(() => {
  clearTokens();
  window.localStorage.clear();
  vi.clearAllMocks();
});

const BORI: ReviewPet = {
  id: "10",
  name: "보리",
  age: 8,
  species: "DOG",
  breedSize: "SMALL",
  breedId: 12,
  weight: 4,
};

const NABI: ReviewPet = {
  id: "11",
  name: "나비",
  age: 3,
  species: "CAT",
  breedSize: null,
  breedId: 45,
  weight: 4.2,
};

const REVIEW: Review = {
  id: "1",
  nickname: "댕댕이짱",
  pets: [BORI],
  rating: 4.5,
  date: "2026. 08. 31",
  images: [],
  tags: ["사용 3주째"],
  content: "확실히 예전보다 계단 오를 때 덜 힘들어해요.",
  likeCount: 32,
  liked: false,
};

describe("ReviewCard", () => {
  it("누가 어떤 아이와 썼는지가 함께 보인다", () => {
    render(<ReviewCard onToggleLike={onToggleLike} review={REVIEW} />);

    expect(screen.getByText("댕댕이짱")).toBeDefined();
    expect(screen.getByText("소형견 · 8세 · 4kg")).toBeDefined();
  });

  // 아이를 여럿 고를 수 있게 바뀌었다. 첫 마리만 적으면 나머지를 숨기는 것이라 사실과 다르다
  it("아이가 여러 마리면 줄이지 않고 전부 적는다", () => {
    render(<ReviewCard onToggleLike={onToggleLike} review={{ ...REVIEW, pets: [BORI, NABI] }} />);

    expect(screen.getByText("소형견 · 8세 · 4kg / 고양이 · 3세 · 4.2kg")).toBeDefined();
  });

  // 원은 작성자가 아니라 함께 먹인 아이들이다 (#488)
  describe("아이 원", () => {
    it("아이 수만큼 원을 그리고 각자 이름 글자를 넣는다", () => {
      render(<ReviewCard onToggleLike={onToggleLike} review={{ ...REVIEW, pets: [BORI, NABI] }} />);

      expect(screen.getByText("보리")).toBeDefined();
      expect(screen.getByText("나비")).toBeDefined();
    });

    // DOM에서 뒤 요소가 기본적으로 위에 그려져, 그냥 두면 시안과 반대로 쌓인다
    it("뒤에 오는 아이일수록 아래로 깔린다", () => {
      render(<ReviewCard onToggleLike={onToggleLike} review={{ ...REVIEW, pets: [BORI, NABI] }} />);

      const front = Number(screen.getByText("보리").style.zIndex);
      const back = Number(screen.getByText("나비").style.zIndex);

      expect(front).toBeGreaterThan(back);
    });

    it("아이마다 색이 다르고 같은 아이는 같은 색이다", () => {
      const { unmount } = render(
        <ReviewCard onToggleLike={onToggleLike} review={{ ...REVIEW, pets: [BORI, NABI] }} />,
      );
      const boriColor = screen.getByText("보리").style.background;

      expect(boriColor).not.toBe("");
      expect(boriColor).not.toBe(screen.getByText("나비").style.background);

      unmount();
      render(<ReviewCard onToggleLike={onToggleLike} review={{ ...REVIEW, pets: [BORI] }} />);

      expect(screen.getByText("보리").style.background).toBe(boriColor);
    });

    // 닉네임이 비어도 아이는 알 수 있다. 아래 아이 줄과 같은 조건으로 그린다
    it("닉네임이 비어 있어도 원을 그린다", () => {
      render(<ReviewCard onToggleLike={onToggleLike} review={{ ...REVIEW, nickname: "" }} />);

      expect(screen.getByText("보리")).toBeDefined();
    });

    // 사진 뷰어는 사진을 이미 크게 보여주고 있어 이 줄을 통째로 뺀다
    it("hideAvatar면 원을 그리지 않는다", () => {
      render(<ReviewCard onToggleLike={onToggleLike} review={REVIEW} hideAvatar />);

      expect(screen.queryByText("보리")).toBeNull();
    });
  });

  // 비로그인 정책이 정해져(#542) 누를 수 있게 됐다(#606, QA 상품상세 7·8·17)
  describe("도움돼요", () => {
    const helpful = () => screen.getByRole("button", { name: /도움이 됐다고 했어요/ });

    it("수와 함께 지금 보는 사람이 눌렀는지를 보인다", () => {
      const { unmount } = render(<ReviewCard onToggleLike={onToggleLike} review={REVIEW} />);

      expect(helpful().textContent).toContain("32");
      expect(helpful().getAttribute("aria-pressed")).toBe("false");

      unmount();
      render(<ReviewCard onToggleLike={onToggleLike} review={{ ...REVIEW, liked: true }} />);

      expect(helpful().getAttribute("aria-pressed")).toBe("true");
    });

    // `0`은 "아무도 안 눌렀다"는 사실이다. 숨기면 그 사실이 사라진다
    it("0이면 0으로 보인다", () => {
      render(<ReviewCard onToggleLike={onToggleLike} review={{ ...REVIEW, likeCount: 0 }} />);

      expect(helpful().textContent).toContain("0");
    });

    it("로그인했으면 누른 뒤의 상태를 넘긴다 — 안 누른 후기는 켜고, 누른 후기는 끈다", () => {
      saveTokens({ accessToken: "a", refreshToken: "r" });
      const { unmount } = render(<ReviewCard onToggleLike={onToggleLike} review={REVIEW} />);

      fireEvent.click(helpful());
      expect(onToggleLike).toHaveBeenLastCalledWith(true);

      unmount();
      render(<ReviewCard onToggleLike={onToggleLike} review={{ ...REVIEW, liked: true }} />);

      fireEvent.click(helpful());
      expect(onToggleLike).toHaveBeenLastCalledWith(false);
    });

    it("로그인하지 않았으면 요청하지 않고 로그인 필요 토스트를 띄운다", () => {
      render(<ReviewCard onToggleLike={onToggleLike} review={REVIEW} />);

      fireEvent.click(helpful());

      expect(onToggleLike).not.toHaveBeenCalled();
      expect(toastAppError).toHaveBeenCalledWith(APP_MESSAGE_CODE.auth.loginRequired);
    });
  });

  // 닉네임 조회가 비면 빈 문자열로 온다. 임의의 이름을 넣으면 남의 글에 다른 이름표가 붙는다
  it("닉네임이 비어 있으면 이름 줄을 그리지 않는다", () => {
    render(<ReviewCard onToggleLike={onToggleLike} review={{ ...REVIEW, nickname: "" }} />);

    expect(screen.queryByText("댕댕이짱")).toBeNull();
    expect(screen.getByText("소형견 · 8세 · 4kg")).toBeDefined();
    expect(screen.getByText(REVIEW.content)).toBeDefined();
  });

  // 신고는 되돌리기 어렵다. 누르는 순간 접수되면 안 된다
  it("신고하기를 눌러도 바로 접수되지 않고 확인창이 먼저 뜬다", () => {
    saveTokens({ accessToken: "a", refreshToken: "r" });
    render(<ReviewCard onToggleLike={onToggleLike} review={REVIEW} />);

    fireEvent.click(screen.getByRole("button", { name: "신고하기" }));

    expect(screen.getByText("이 후기를 신고할까요?")).toBeDefined();
  });

  it("로그인하지 않았으면 신고 확인창 대신 로그인 필요 토스트를 띄운다", () => {
    render(<ReviewCard onToggleLike={onToggleLike} review={REVIEW} />);

    fireEvent.click(screen.getByRole("button", { name: "신고하기" }));

    expect(screen.queryByText("이 후기를 신고할까요?")).toBeNull();
    expect(toastAppError).toHaveBeenCalledWith(APP_MESSAGE_CODE.auth.loginRequired);
  });

  it("사진이 없으면 사진 자리를 그리지 않는다", () => {
    render(<ReviewCard onToggleLike={onToggleLike} review={REVIEW} />);

    expect(screen.queryByRole("img", { name: /후기 사진/ })).toBeNull();
  });

  it("사진이 있으면 몇 번째인지 알려준다", () => {
    render(
      <ReviewCard
        onToggleLike={onToggleLike}
        review={{ ...REVIEW, images: ["https://img.example/a.webp"] }}
      />,
    );

    expect(screen.getByRole("img", { name: "후기 사진 1번째" })).toBeDefined();
  });
});
