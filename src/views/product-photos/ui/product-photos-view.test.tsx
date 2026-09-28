// 사진 모음 테스트. 격자에서 상세로 가는 길과, 주소가 후기 번호로 자리를 가리키는지 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

import type { ReviewDetail, ReviewPhoto } from "@/entities/review";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/products/1/photos",
}));

const useQueryReviewPhotos = vi.fn();
const useQueryReviewDetail = vi.fn();
vi.mock("@/entities/review", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/review")>()),
  useQueryReviewPhotos: () => useQueryReviewPhotos(),
  useQueryReviewDetail: (reviewId: string) => useQueryReviewDetail(reviewId),
}));

import { ProductPhotosView } from "./product-photos-view";

/** 7번 후기가 두 장, 9번 후기가 한 장. 한 후기의 사진은 서버가 이어서 준다 */
const PHOTOS: ReviewPhoto[] = [
  { reviewId: "7", imageUrl: "https://img.example/7-a.webp" },
  { reviewId: "7", imageUrl: "https://img.example/7-b.webp" },
  { reviewId: "9", imageUrl: "https://img.example/9-a.webp" },
];

const DETAIL: ReviewDetail = {
  id: "7",
  isMine: false,
  product: { id: "1", name: "관절 영양제" },
  pets: [{ id: "10", name: "보리", age: 8, species: "DOG", breedSize: "SMALL" }],
  rating: 4.5,
  usageDays: 21,
  goodPoints: [],
  badPoints: [],
  content: "계단 오를 때 덜 힘들어해요.",
  images: ["https://img.example/7-a.webp", "https://img.example/7-b.webp"],
  createdAt: "2026-08-31",
};

function photosState(part: Record<string, unknown> = {}) {
  return {
    photos: PHOTOS,
    totalCount: 3,
    error: null,
    isLoading: false,
    hasNext: false,
    loadNext: vi.fn(),
    isLoadingNext: false,
    nextError: false,
    ...part,
  };
}

function renderView(search = "", onUrlUpdate?: (event: UrlUpdateEvent) => void) {
  render(
    <NuqsTestingAdapter searchParams={search} onUrlUpdate={onUrlUpdate}>
      <ProductPhotosView productId="1" />
    </NuqsTestingAdapter>,
  );
}

describe("격자", () => {
  it("서버가 준 사진을 장수와 함께 보여준다", () => {
    useQueryReviewPhotos.mockReturnValue(photosState());
    useQueryReviewDetail.mockReturnValue({ review: undefined, isLoading: false });

    renderView();

    expect(screen.getByText(/사진이 있는 리뷰/).textContent).toContain("3");
    expect(screen.getAllByRole("button", { name: /크게 보기/ })).toHaveLength(3);
  });

  it("사진이 없으면 빈 상태를 보여준다", () => {
    useQueryReviewPhotos.mockReturnValue(photosState({ photos: [], totalCount: 0 }));
    useQueryReviewDetail.mockReturnValue({ review: undefined, isLoading: false });

    renderView();

    expect(screen.getByText("아직 사진 후기가 없어요")).toBeDefined();
  });

  it("실패하면 무엇이 잘못됐는지 화면에서 알린다", () => {
    useQueryReviewPhotos.mockReturnValue(
      photosState({ photos: [], totalCount: null, error: new Error("boom") }),
    );
    useQueryReviewDetail.mockReturnValue({ review: undefined, isLoading: false });

    renderView();

    expect(screen.getByRole("alert")).toBeDefined();
  });
});

describe("주소로 자리를 가리킨다", () => {
  // 전에는 배열 순번이었다. 쪽을 이어 받으면 같은 번호가 다른 사진을 가리킨다
  it("사진을 누르면 후기 번호와 그 후기 안 순번이 실린다", async () => {
    const updates: UrlUpdateEvent[] = [];
    useQueryReviewPhotos.mockReturnValue(photosState());
    useQueryReviewDetail.mockReturnValue({ review: DETAIL, isLoading: false });

    renderView("", (event) => updates.push(event));

    // 7번 후기의 두 번째 사진
    fireEvent.click(screen.getAllByRole("button", { name: /크게 보기/ })[1]);

    // nuqs는 주소를 다음 틱에 반영한다
    await waitFor(() => expect(updates.length).toBeGreaterThan(0));

    const search = updates.at(-1)?.searchParams;
    expect(search?.get("photo")).toBe("7");
    expect(search?.get("n")).toBe("1");
  });

  it("주소에 후기 번호가 있으면 뷰어가 열린다", () => {
    useQueryReviewPhotos.mockReturnValue(photosState());
    useQueryReviewDetail.mockReturnValue({ review: DETAIL, isLoading: false });

    renderView("?photo=7&n=1");

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(useQueryReviewDetail).toHaveBeenCalledWith("7");
  });

  // 격자가 그 쪽까지 안 받았어도 뷰어가 후기를 직접 받는다
  it("격자에 없는 후기 번호로 들어와도 뷰어가 그 후기를 받는다", () => {
    useQueryReviewPhotos.mockReturnValue(photosState({ photos: [PHOTOS[2]], totalCount: 30 }));
    useQueryReviewDetail.mockReturnValue({ review: DETAIL, isLoading: false });

    renderView("?photo=7&n=0");

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(useQueryReviewDetail).toHaveBeenCalledWith("7");
  });

  it("범위를 벗어난 순번으로 들어와도 있는 사진을 보여준다", () => {
    useQueryReviewPhotos.mockReturnValue(photosState());
    useQueryReviewDetail.mockReturnValue({ review: DETAIL, isLoading: false });

    renderView("?photo=7&n=99");

    // 두 장뿐이므로 마지막 장으로 잘린다
    expect(screen.getByText("2장 중 2번째")).toBeDefined();
  });
});

// 공개 리뷰 상세에 닉네임과 도움돼요 수가 없다. 진짜 후기 글에 다른 이름표를 붙이지 않는다(#339)
describe("뷰어 아래 후기 카드", () => {
  it("상세로 채울 수 있는 것만 보여준다", () => {
    useQueryReviewPhotos.mockReturnValue(photosState());
    useQueryReviewDetail.mockReturnValue({ review: DETAIL, isLoading: false });

    renderView("?photo=7&n=0");

    expect(screen.getByText("소형견 · 8세")).toBeDefined();
    expect(screen.getByText("계단 오를 때 덜 힘들어해요.")).toBeDefined();
    expect(screen.getByText("사용 21일")).toBeDefined();
  });

  it("닉네임과 도움돼요 수는 지어내지 않는다", () => {
    useQueryReviewPhotos.mockReturnValue(photosState());
    useQueryReviewDetail.mockReturnValue({ review: DETAIL, isLoading: false });

    renderView("?photo=7&n=0");

    expect(screen.queryByText(/도움이 됐다고 했어요/)).toBeNull();
  });
});
