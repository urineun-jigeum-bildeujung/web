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

// 찜은 서버에 저장한다(#483). 로그인·찜 여부는 서버 상태라 값만 세운다
const { toggleWish, wish } = vi.hoisted(() => ({
  toggleWish: vi.fn(),
  wish: { status: undefined as boolean | undefined, loading: false },
}));
vi.mock("@/features/toggle-wishlist", () => ({
  useToggleWishlist: () => ({ signedIn: true, toggle: toggleWish }),
}));
vi.mock("@/entities/wishlist", () => ({
  useQueryWishlistStatus: (productId: number) => ({
    wished: productId === 1 ? wish.status : undefined,
    isLoading: wish.loading,
  }),
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
  nickname: "댕댕이짱",
  likeCount: 0,
  liked: false,
  product: { id: "1", name: "관절 영양제" },
  pets: [
    { id: "10", name: "보리", age: 8, species: "DOG", breedSize: "SMALL", breedId: 12, weight: 4 },
  ],
  rating: 4.5,
  usageDays: 21,
  goodPoints: [],
  badPoints: [],
  content: "계단 오를 때 덜 힘들어해요.",
  images: ["https://img.example/7-a.webp", "https://img.example/7-b.webp"],
  createdAt: "2026-08-31",
};

/** 화살표를 두 번 눌러도 끝에 닿지 않도록 세 장짜리를 따로 둔다 */
const THREE_PHOTO_DETAIL: ReviewDetail = {
  ...DETAIL,
  images: [
    "https://img.example/7-a.webp",
    "https://img.example/7-b.webp",
    "https://img.example/7-c.webp",
  ],
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

  // 화살표는 키보드 초점에서만 나오므로 이 경로가 깨져도 눈에 띄지 않는다.
  //
  // **주소와 줄의 자리를 일부러 어긋내 둔다.** 연달아 누르는 것을 그대로 흉내 내면
  // `fireEvent`가 act()로 감싸져 누름 사이에 주소 갱신이 반영되므로, 실제로 겪는
  // "주소가 아직 안 바뀐 창"이 jsdom에서는 열리지 않는다 — 그 모양으로는 옛 방식
  // (`current + step`)으로 되돌려도 통과해 회귀를 잡지 못한다 (리뷰 반영)
  it("화살표는 주소가 아니라 줄의 실제 자리에서 다음을 센다", async () => {
    const updates: UrlUpdateEvent[] = [];
    useQueryReviewPhotos.mockReturnValue(photosState());
    useQueryReviewDetail.mockReturnValue({ review: THREE_PHOTO_DETAIL, isLoading: false });

    // 주소는 첫 장을 가리키는데
    renderView("?photo=7&n=0", (event) => updates.push(event));

    // jsdom은 레이아웃을 재지 않아 폭이 늘 0이다. 자리 계산이 그 값을 나누므로 세워 둔다
    const track = screen.getByRole("list", { name: "후기 사진" });
    Object.defineProperty(track, "clientWidth", { value: 393, configurable: true });
    // 줄은 이미 두 번째 장에 가 있다 — 연달아 누르는 중 주소만 뒤처진 그 순간이다
    track.scrollLeft = 393;

    fireEvent.click(screen.getByRole("button", { name: "다음 사진" }));

    // 주소(0)를 기준으로 셌다면 첫 장 다음인 393에 머문다
    expect(track.scrollLeft).toBe(393 * 2);
    await waitFor(() => expect(updates.at(-1)?.searchParams.get("n")).toBe("2"));
  });

  // 여기서도 주소와 줄을 어긋내야 한다. 둘이 같으면 첫 장에서 이전 버튼이 `disabled`라
  // 눌러도 아무 일이 없어, 자르는 계산을 통째로 지워도 통과한다 (리뷰 반영)
  it("줄이 이미 첫 장이면 이전을 눌러도 범위를 벗어나지 않는다", async () => {
    const updates: UrlUpdateEvent[] = [];
    useQueryReviewPhotos.mockReturnValue(photosState());
    useQueryReviewDetail.mockReturnValue({ review: THREE_PHOTO_DETAIL, isLoading: false });

    // 주소는 둘째 장이라 이전 버튼이 살아 있고
    renderView("?photo=7&n=1", (event) => updates.push(event));

    const track = screen.getByRole("list", { name: "후기 사진" });
    Object.defineProperty(track, "clientWidth", { value: 393, configurable: true });
    // 줄은 이미 첫 장에 와 있다
    track.scrollLeft = 0;

    fireEvent.click(screen.getByRole("button", { name: "이전 사진" }));

    // 자르지 않았다면 -1장째, 곧 -393으로 갔을 자리다
    expect(track.scrollLeft).toBe(0);
    // `n`은 기본값이 0이라 0으로 돌아가면 nuqs가 쿼리에서 지운다. 자르지 않았다면
    // 기본값이 아닌 -1이 실려 남는다
    await waitFor(() => expect(updates.length).toBeGreaterThan(0));
    expect(updates.at(-1)?.searchParams.get("n")).toBeNull();
  });
});

// 공개 리뷰 상세에 닉네임과 도움돼요 수가 없다. 진짜 후기 글에 다른 이름표를 붙이지 않는다(#339)
describe("뷰어 아래 후기 카드", () => {
  it("상세로 채울 수 있는 것만 보여준다", () => {
    useQueryReviewPhotos.mockReturnValue(photosState());
    useQueryReviewDetail.mockReturnValue({ review: DETAIL, isLoading: false });

    renderView("?photo=7&n=0");

    expect(screen.getByText("소형견 · 8세 · 4kg")).toBeDefined();
    expect(screen.getByText("계단 오를 때 덜 힘들어해요.")).toBeDefined();
    expect(screen.getByText("사용 3주째")).toBeDefined();
  });

  // 공개 상세에 셋이 실려 이름 줄과 도움돼요가 살아났다
  it("닉네임과 도움돼요 수를 보여준다", () => {
    useQueryReviewPhotos.mockReturnValue(photosState());
    useQueryReviewDetail.mockReturnValue({ review: DETAIL, isLoading: false });

    renderView("?photo=7&n=0");

    expect(screen.getByText("댕댕이짱")).toBeDefined();
    expect(screen.getByText(/도움이 됐다고 했어요/)).toBeDefined();
  });

  // 화면 안 상태로 두던 동안 새로고침하면 사라지고 좋아요 탭에도 뜨지 않았다 (#483)
  describe("뷰어의 찜", () => {
    // 모르는 채로 누르면 토글이라 이미 찜한 상품의 찜이 서버에서 지워진다 (#493 리뷰)
    it("찜 여부를 받는 동안은 누를 수 없다", () => {
      wish.loading = true;
      useQueryReviewPhotos.mockReturnValue(photosState());
      useQueryReviewDetail.mockReturnValue({ review: DETAIL, isLoading: false });
      renderView("?photo=7&n=0");

      expect(screen.getByRole("button", { name: "찜 목록에 담기" })).toHaveProperty(
        "disabled",
        true,
      );
      wish.loading = false;
    });

    it("이 상품을 찜했으면 채운 하트로 열린다", () => {
      wish.status = true;
      useQueryReviewPhotos.mockReturnValue(photosState());
      useQueryReviewDetail.mockReturnValue({ review: DETAIL, isLoading: false });
      renderView("?photo=7&n=0");

      expect(
        screen.getByRole("button", { name: "찜 목록에서 빼기" }).getAttribute("aria-pressed"),
      ).toBe("true");
      wish.status = undefined;
    });

    it("누르면 이 상품의 찜을 서버에서 뒤집는다", () => {
      toggleWish.mockReturnValue(true);
      useQueryReviewPhotos.mockReturnValue(photosState());
      useQueryReviewDetail.mockReturnValue({ review: DETAIL, isLoading: false });
      renderView("?photo=7&n=0");

      fireEvent.click(screen.getByRole("button", { name: "찜 목록에 담기" }));

      // 가격을 몰라 좋아요 탭 목록에 먼저 넣을 줄은 넘기지 않는다
      expect(toggleWish).toHaveBeenCalledWith(1, true);
    });
  });
});
