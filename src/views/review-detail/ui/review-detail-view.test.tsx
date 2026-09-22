// 서버 응답의 네 상태(받는 중·없음·실패·내용)를 가르는지, 사진 점이 있는지, 신고·구매 줄이 props로만 켜지는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import type { ReviewDetail } from "@/entities/review";
import { ApiError } from "@/shared/api/client";

const push = vi.fn();
const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back }) }));

// 무엇을 부르고 어떻게 옮기는지는 각 entities의 api 테스트가 본다. 여기서는 상태만 세운다
const useQueryReviewDetail = vi.fn();
vi.mock("@/entities/review", () => ({
  useQueryReviewDetail: () => useQueryReviewDetail(),
}));
vi.mock("@/entities/member", () => ({
  useQueryMyProfile: () => ({ profile: { nickname: "보리엄마" } }),
}));
vi.mock("@/entities/pet", () => ({
  useQueryPetDetail: (petId: string | undefined) => ({
    pet: petId === "3" ? { breedName: "말티즈", age: 8, weight: 4 } : undefined,
  }),
}));

import { ReviewDetailView } from "./review-detail-view";

const REVIEW: ReviewDetail = {
  id: "1",
  isMine: true,
  product: { id: "7", name: "오메가3 피쉬오일 60캡슐" },
  petId: "3",
  rating: 4,
  usageDays: 16,
  goodPoints: ["기호성 좋음"],
  badPoints: ["소화·배변 나쁨"],
  content: "확실히 잘 먹어요",
  images: ["https://image.leechs.shop/reviews/1.jpg", "https://image.leechs.shop/reviews/2.jpg"],
  createdAt: "2026-09-21",
};

const loaded = (review: ReviewDetail | undefined, error: unknown = null) => ({
  review,
  isLoading: false,
  isRetrying: false,
  error,
  refetch: vi.fn(),
});

beforeEach(() => {
  push.mockClear();
  back.mockClear();
  useQueryReviewDetail.mockReturnValue(loaded(REVIEW));
});

test("사진·닉네임·별점·날짜·칩(아이 프로필·사용 기간·반응)·글을 시안 꼴로 보인다", () => {
  render(<ReviewDetailView reviewId="1" />);

  expect(screen.getByAltText("후기 사진 1번째")).toBeDefined();
  expect(screen.getByText("보리엄마")).toBeDefined();
  expect(screen.getByText("5점 만점에 4점")).toBeDefined();
  expect(screen.getByText("2026. 09. 21")).toBeDefined();
  const chips = screen.getByRole("list", { name: "아이와 사용 기간, 반응" });
  expect(chips.textContent).toBe("말티즈 · 8세 · 4kg사용 2주째기호성 좋음소화·배변 나쁨");
  expect(screen.getByText("확실히 잘 먹어요")).toBeDefined();
});

test("사진이 여러 장이면 점이 장수만큼 있고 몇 번째인지 읽힌다", () => {
  render(<ReviewDetailView reviewId="1" />);

  expect(screen.getByText("2장 중 1번째")).toBeDefined();
  expect(screen.getAllByRole("button", { name: /번째 사진 보기/ })).toHaveLength(2);
  expect(screen.getByAltText("후기 사진 2번째")).toBeDefined();
});

test("X로 닫으면 앞 화면으로 돌아간다", () => {
  render(<ReviewDetailView reviewId="1" />);

  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  expect(back).toHaveBeenCalled();
});

test("사진이 없으면 사진 자리 없이 후기만 보인다", () => {
  useQueryReviewDetail.mockReturnValue(loaded({ ...REVIEW, images: [] }));
  render(<ReviewDetailView reviewId="1" />);

  expect(screen.queryByAltText(/후기 사진/)).toBeNull();
  expect(screen.getByText("확실히 잘 먹어요")).toBeDefined();
});

// 마이페이지의 내 리뷰는 시안의 신고·도움돼요 줄과 하단 구매 줄을 끈다
test("기본은 신고하기·도움돼요와 하단 찜·장바구니·바로 구매가 없다", () => {
  render(<ReviewDetailView reviewId="1" />);

  expect(screen.queryByRole("button", { name: /신고하기|구매|장바구니|찜/ })).toBeNull();
  expect(screen.queryByText("이 후기가 도움이 됐어요")).toBeNull();
});

// 상품 쪽에서 남의 리뷰를 볼 때는 시안 그대로 켠다
test("props로 켜면 신고·도움돼요 줄과 구매 줄이 있고 바로 구매는 상품 상세로 간다", () => {
  render(<ReviewDetailView reviewId="1" showReactions showPurchaseBar />);

  expect(screen.getByRole("button", { name: "신고하기" })).toBeDefined();
  expect(screen.getByRole("button", { name: /이 후기가 도움이 됐어요/ })).toBeDefined();
  expect(screen.getByRole("button", { name: "찜 목록에 담기" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "바로 구매" }));
  expect(push).toHaveBeenCalledWith("/products/7");
});

test("없는 리뷰는 찾을 수 없다고 알리고 다시 시도를 두지 않는다", () => {
  useQueryReviewDetail.mockReturnValue(loaded(undefined, new ApiError(404, "없음")));
  render(<ReviewDetailView reviewId="999" />);

  expect(screen.getByText("리뷰를 찾을 수 없어요")).toBeDefined();
  expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull();
});

test("받는 동안은 자리를 잡아 두고, 못 받으면 다시 시도할 수 있다", () => {
  useQueryReviewDetail.mockReturnValue({ ...loaded(undefined), isLoading: true });
  const first = render(<ReviewDetailView reviewId="1" />);
  expect(screen.getByLabelText("리뷰를 불러오는 중")).toBeDefined();
  first.unmount();

  const failed = loaded(undefined, new Error("500"));
  useQueryReviewDetail.mockReturnValue(failed);
  render(<ReviewDetailView reviewId="1" />);
  expect(screen.getByText("리뷰를 불러오지 못했어요")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  expect(failed.refetch).toHaveBeenCalled();
});
