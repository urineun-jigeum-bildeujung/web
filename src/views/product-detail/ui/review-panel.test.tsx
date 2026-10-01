// 리뷰 탭 테스트. 서버 응답의 네 상태, 거르기 조건을 서버로 넘기는지(#472), 맞춤보기가 아직 닫혀 있는지 본다.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Review } from "@/entities/review";
import { clearTokens, saveTokens } from "@/shared/api/token-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/products/1",
}));

// 무엇을 부르고 어떻게 옮기는지는 `entities/review/api`가 본다. 여기서는 상태만 세운다.
// `ReviewCard`와 정렬 목록은 진짜를 써야 화면이 실제로 그려진다
const useQueryProductReviews = vi.fn();
const useQueryFeaturedReviewPhotos = vi.fn();
const toggleRecommend = vi.fn();
vi.mock("@/entities/review", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/review")>()),
  useQueryProductReviews: (args: unknown) => useQueryProductReviews(args),
  useQueryFeaturedReviewPhotos: () => useQueryFeaturedReviewPhotos(),
  useMutateReviewRecommend: () => ({ toggle: toggleRecommend }),
  useQueryProductReviewCount: () => ({ count: 3, isCounting: false }),
}));
// 거르기 시트가 품종·건강 관심사 목록을 받는다. 시트 자체는 review-filter-sheet.test가 본다
vi.mock("@/entities/pet", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/pet")>()),
  useQueryBreeds: () => ({ breeds: [], isLoading: false, error: null }),
  useQueryHealthOptions: () => ({
    options: { concerns: [], allergies: [] },
    isLoading: false,
    error: null,
  }),
}));

afterEach(() => {
  clearTokens();
  window.localStorage.clear();
  vi.clearAllMocks();
});

import { ReviewPanel } from "./review-panel";

const REVIEWS: Review[] = [
  {
    id: "1",
    nickname: "댕댕이짱",
    pets: [
      {
        id: "10",
        name: "보리",
        age: 8,
        species: "DOG",
        breedSize: "SMALL",
        breedId: 12,
        breedName: "시츄",
        weight: 4,
      },
    ],
    rating: 4.5,
    date: "2026. 08. 31",
    images: [],
    tags: ["사용 21일"],
    content: "계단 오를 때 덜 힘들어해요.",
    likeCount: 32,
    liked: false,
  },
  {
    id: "2",
    nickname: "초코집사",
    pets: [
      {
        id: "11",
        name: "초코",
        age: 6,
        species: "DOG",
        breedSize: "LARGE",
        breedId: 30,
        breedName: "허스키",
        weight: 4,
      },
    ],
    rating: 5,
    date: "2026. 08. 14",
    images: [],
    tags: ["사용 180일"],
    content: "대형견이라 양이 많이 드는데 좋아요.",
    likeCount: 51,
    liked: false,
  },
];

function listState(part: Partial<ReturnType<typeof baseList>> = {}) {
  return { ...baseList(), ...part };
}

function baseList() {
  return {
    reviews: REVIEWS as Review[] | undefined,
    averageRating: 4.8 as number | null,
    totalCount: 108 as number | null,
    error: null as unknown,
    isLoading: false,
    hasNext: false,
    loadNext: vi.fn(),
    isLoadingNext: false,
    nextError: false,
  };
}

function renderPanel(search = "") {
  render(
    <NuqsTestingAdapter searchParams={search}>
      <ReviewPanel productId="1" />
    </NuqsTestingAdapter>,
  );
}

describe("별점 요약", () => {
  it("목록 응답의 평균과 총 개수를 보여준다", () => {
    useQueryProductReviews.mockReturnValue(listState());
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel();

    expect(screen.getByText("총 리뷰 108개")).toBeDefined();
  });

  // 0.0을 적으면 아직 아무도 평가하지 않은 상품이 평이 나쁜 상품처럼 읽힌다
  it("후기가 0이면 숫자를 적지 않고 낭독 문구를 바꾼다", () => {
    useQueryProductReviews.mockReturnValue(
      listState({ reviews: [], averageRating: 0, totalCount: 0 }),
    );
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel();

    const summary = within(screen.getByRole("region", { name: "별점 요약" }));
    expect(summary.queryByText("0.0")).toBeNull();
    expect(summary.getByText("아직 평가가 없어요")).toBeDefined();
    expect(screen.getByText("아직 후기가 없어요")).toBeDefined();
  });
});

describe("목록", () => {
  it("후기가 보이고 아이 정보가 함께 읽힌다", () => {
    useQueryProductReviews.mockReturnValue(listState());
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel();

    // 별점만 나열하면 시츄와 허스키의 후기가 같아 보인다
    expect(screen.getByText("시츄 · 8세 · 4kg")).toBeDefined();
    expect(screen.getByText("허스키 · 6세 · 4kg")).toBeDefined();
  });

  it("처음 받는 동안에는 자리를 잡아 둔다", () => {
    useQueryProductReviews.mockReturnValue(listState({ reviews: undefined, isLoading: true }));
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel();

    expect(screen.queryByText("시츄 · 8세")).toBeNull();
    expect(screen.queryByText("아직 후기가 없어요")).toBeNull();
  });

  it("실패하면 무엇이 잘못됐는지 화면에서 알린다", () => {
    useQueryProductReviews.mockReturnValue(
      listState({ reviews: [], error: new Error("boom"), totalCount: null }),
    );
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel();

    expect(screen.getByRole("alert")).toBeDefined();
  });
});

describe("정렬", () => {
  it("주소에 실린 정렬을 그대로 서버에 넘긴다", () => {
    useQueryProductReviews.mockReturnValue(listState());
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel("?reviewSort=rating-low");

    expect(useQueryProductReviews).toHaveBeenCalledWith({
      productId: "1",
      sort: "rating-low",
      conditions: {},
    });
  });
});

describe("리뷰 사진 줄", () => {
  it("서버가 준 대표 사진을 그대로 걸고 후기 번호로 잇는다", () => {
    useQueryProductReviews.mockReturnValue(listState());
    useQueryFeaturedReviewPhotos.mockReturnValue({
      photos: [
        { reviewId: "7", imageUrl: "https://img.example/a.webp" },
        { reviewId: "9", imageUrl: "https://img.example/b.webp" },
      ],
    });

    renderPanel();

    const photos = within(screen.getByRole("region", { name: "리뷰 사진" }));
    const links = photos.getAllByRole("link", { name: "이 후기의 첫 사진 크게 보기" });

    expect(links).toHaveLength(2);
    // 대표 사진은 서버가 `sortOrder = 0`으로 고른 그 후기의 첫 장이라 `n=0`이 같은 사진이다
    expect(links[0].getAttribute("href")).toBe("/products/1/photos?photo=7&n=0");
    expect(links[1].getAttribute("href")).toBe("/products/1/photos?photo=9&n=0");
  });

  it("대표 사진이 없으면 줄째로 빠진다", () => {
    useQueryProductReviews.mockReturnValue(listState());
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel();

    expect(screen.queryByRole("region", { name: "리뷰 사진" })).toBeNull();
  });
});

// 서버가 받는 모양과 화면이 고르는 모양이 달라 닫아 뒀다(#339).
// 되는 조건만 보내면 고른 것이 조용히 무시되고, 그냥 두면 눌러도 목록이 안 바뀐다
describe("계약이 없어 닫아 둔 것", () => {
  // 서버가 종과 체구만 견주어 안내 문구와 달라 PD 확인을 기다린다(#472)
  it("맞춤보기 토글은 아직 없다", () => {
    useQueryProductReviews.mockReturnValue(listState());
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel("?reviewMatch=on");

    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByText("내 반려동물 맞춤보기")).toBeNull();
  });
});

// 백엔드가 구간·복수 조건을 받게 되어 시트를 다시 붙였다 (#472)
describe("거르기", () => {
  it("고른 조건이 없으면 조건 없이 부르고 필터 지우기가 없다", () => {
    useQueryProductReviews.mockReturnValue(listState());
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel();

    expect(screen.getByRole("button", { name: "기본 맞춤 필터" })).toBeDefined();
    expect(useQueryProductReviews).toHaveBeenLastCalledWith(
      expect.objectContaining({ conditions: {} }),
    );
    expect(screen.queryByRole("button", { name: "필터 지우기" })).toBeNull();
    expect(screen.getByText("총 리뷰 108개")).toBeDefined();
  });

  it("주소의 조건을 서버 조건으로 바꿔 넘기고, 조건에 맞는 수라고 알린다", () => {
    useQueryProductReviews.mockReturnValue(listState());
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel("?reviewFilter=species:cat|age:2-8|breed:1,3");

    expect(useQueryProductReviews).toHaveBeenLastCalledWith(
      expect.objectContaining({
        conditions: { species: "CAT", ageMin: 2, ageMax: 8, breedIds: [1, 3] },
      }),
    );
    expect(screen.getByText("조건에 맞는 리뷰 108개")).toBeDefined();
    expect(screen.getByRole("button", { name: "필터 지우기" })).toBeDefined();
  });

  it("조건에 맞는 후기가 없으면 지울 길과 함께 알린다", () => {
    useQueryProductReviews.mockReturnValue({ ...listState(), reviews: [], totalCount: 0 });
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel("?reviewFilter=species:cat");

    expect(screen.getByText("조건에 맞는 후기가 없어요")).toBeDefined();
    expect(screen.queryByText("아직 후기가 없어요")).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "필터 지우기" })[0]);

    expect(useQueryProductReviews).toHaveBeenLastCalledWith(
      expect.objectContaining({ conditions: {} }),
    );
  });
});

// 비로그인 정책이 정해져(#542) 누를 수 있게 됐다(#606, QA 상품상세 7·8)
describe("도움돼요", () => {
  it("누르면 그 후기를 누른 뒤의 상태로 넘긴다", () => {
    saveTokens({ accessToken: "a", refreshToken: "r" });
    useQueryProductReviews.mockReturnValue(listState());
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel();
    const [first] = screen.getAllByRole("button", { name: /도움이 됐다고 했어요/ });
    fireEvent.click(first);

    expect(toggleRecommend).toHaveBeenCalledWith("1", true);
  });
});

describe("더보기", () => {
  it("다음 쪽만 실패하면 보던 목록을 지우지 않고 다시 시도를 준다", () => {
    const loadNext = vi.fn();
    useQueryProductReviews.mockReturnValue(listState({ hasNext: true, nextError: true, loadNext }));
    useQueryFeaturedReviewPhotos.mockReturnValue({ photos: [] });

    renderPanel();

    expect(screen.getByText("시츄 · 8세 · 4kg")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /다시 시도/ }));
    expect(loadNext).toHaveBeenCalled();
  });
});
