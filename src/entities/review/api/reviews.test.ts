// 리뷰 등록·내 후기 조회 테스트. 무엇을 부르고 응답을 화면 모양으로 어떻게 옮기는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import {
  createReview,
  getFeaturedReviewPhotos,
  getMyReviews,
  getProductReviews,
  getReviewDetail,
  getReviewPhotos,
  getWritableReviews,
  issueReviewImageUpload,
} from "./reviews";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("등록 요청을 그대로 보내고 reviewId를 받는다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ reviewId: 9 }, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  const request = {
    productId: 7,
    petIds: [1, 2],
    starRate: 4.5,
    usagePeriod: 16,
    answerValues: [{ questionKey: "PALATABILITY", answerValue: "POSITIVE" }],
    text: "확실히 잘 먹어요",
  };

  await expect(createReview(request)).resolves.toEqual({ reviewId: 9 });

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/reviews");
  expect(init.method).toBe("POST");
  expect(JSON.parse(String(init.body))).toEqual(request);
});

test("리뷰 사진 발급은 리뷰 주소로 확장자를 보낸다", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      Response.json({ uploadUrl: "https://s3/put", fileUrl: "https://cdn/a.jpg" }),
    );
  vi.stubGlobal("fetch", fetchMock);

  await issueReviewImageUpload("jpg");

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/reviews/images/presigned-url");
  expect(JSON.parse(String(init.body))).toEqual({ extension: "jpg" });
});

test("내 후기는 쪽을 쿼리로 보내고 화면 모양으로 옮긴다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      content: [
        {
          reviewId: 3,
          productId: 7,
          productName: "멍 바나나스낵",
          productImage: null,
          rating: 4,
          text: "잘 먹어요",
          createdAt: "2026-07-20",
        },
      ],
      hasNext: false,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const list = await getMyReviews({ page: 0, size: 20 });

  expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/reviews/me?page=0&size=20");
  expect(list).toEqual({
    items: [
      {
        id: "3",
        productId: "7",
        name: "멍 바나나스낵",
        rating: 4,
        content: "잘 먹어요",
        createdAt: "2026-07-20",
      },
    ],
    hasNext: false,
  });
  // 사진이 없으면 키 자체를 두지 않는다. `undefined`가 들어가면 화면이 있는 줄 안다
  expect("imageUrl" in list.items[0]).toBe(false);
});

test("작성 가능한 상품 목록을 받아 화면 모양으로 옮긴다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      content: [
        {
          orderProductId: 12,
          productId: 7,
          productName: "저자극 덴탈껌 14개입",
          thumbnailUrl: null,
          confirmedAt: "2026-08-28T15:43:00+09:00",
        },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const items = await getWritableReviews();

  expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/reviews/writable");
  expect(items).toEqual([
    {
      orderProductId: "12",
      productId: "7",
      name: "저자극 덴탈껌 14개입",
      confirmedAt: "2026-08-28T15:43:00+09:00",
    },
  ]);
  // 사진이 없으면 키 자체를 두지 않는다. `undefined`가 들어가면 화면이 있는 줄 안다
  expect("imageUrl" in items[0]).toBe(false);
});

test("리뷰 상세를 받아 화면 모양으로 옮기고(아이 여러 마리·0.5 별점), 비어 있는 목록은 빈 배열로 둔다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      reviewId: 1,
      isMine: true,
      product: { productId: 1, name: "오메가3 피쉬오일 60캡슐", image: null },
      pets: [
        { petId: 3, name: "코코", sex: "FEMALE", age: 4, breedSize: "SMALL", species: "DOG" },
        { petId: 5, name: "나비", sex: "MALE", age: 2, breedSize: null, species: "CAT" },
      ],
      rating: 4.5,
      usagePeriod: 16,
      answerValues: [{ questionKey: "PALATABILITY", answerValue: "POSITIVE" }],
      goodPoints: ["기호성 좋음"],
      badPoints: null,
      matchScore: null,
      text: "확실히 잘 먹어요",
      images: null,
      createdAt: "2026-09-21",
    }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const review = await getReviewDetail("1");

  expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/reviews/1");
  expect(review).toEqual({
    id: "1",
    isMine: true,
    product: { id: "1", name: "오메가3 피쉬오일 60캡슐" },
    pets: [
      { id: "3", name: "코코", age: 4, species: "DOG", breedSize: "SMALL" },
      { id: "5", name: "나비", age: 2, species: "CAT", breedSize: null },
    ],
    rating: 4.5,
    usageDays: 16,
    goodPoints: ["기호성 좋음"],
    badPoints: [],
    content: "확실히 잘 먹어요",
    images: [],
    createdAt: "2026-09-21",
  });
  // 사진이 없으면 키 자체를 두지 않는다. `undefined`가 들어가면 화면이 있는 줄 안다
  expect("imageUrl" in review.product).toBe(false);
});

// 실제 백엔드 응답 모양 그대로다(로컬 실응답으로 확인). 사진 없는 후기의 `images`는 `null`,
// 닉네임을 못 찾은 회원은 빈 문자열, 고양이는 `breedSize`가 `null`로 온다
const PRODUCT_REVIEWS = {
  averageRating: 3.8333333333333335,
  totalCount: 12,
  content: [
    {
      reviewId: 1,
      nickname: "테스트회원1",
      pets: [
        { petId: 101, name: "보리", sex: "FEMALE", age: 8, breedSize: "SMALL", species: "DOG" },
        { petId: 102, name: "나비", sex: "MALE", age: 3, breedSize: null, species: "CAT" },
      ],
      rating: 4.5,
      usagePeriod: "21일",
      palatability: null,
      text: "계단 오를 때 덜 힘들어해요.",
      images: ["https://cdn/a.webp", "https://cdn/b.webp"],
      likeCount: 3,
      createdAt: "2026-09-27",
    },
    {
      reviewId: 11,
      nickname: "",
      pets: [
        { petId: 113, name: "해피", sex: "MALE", age: 4, breedSize: "MEDIUM", species: "DOG" },
      ],
      rating: 4.5,
      usagePeriod: "22일",
      palatability: "좋아함",
      text: "닉네임을 못 찾는 회원의 후기입니다.",
      images: null,
      likeCount: 0,
      createdAt: "2026-09-17",
    },
  ],
};

test("상품 후기 목록은 정렬을 백엔드 열거형으로 바꿔 보낸다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(PRODUCT_REVIEWS));
  vi.stubGlobal("fetch", fetchMock);

  await getProductReviews({ productId: "1", sort: "recent", page: 2, size: 10 });

  const url = new URL(String(fetchMock.mock.calls[0]?.[0]), "http://x");
  expect(url.pathname).toContain("/reviews/products/1");
  // 화면 값은 `recent`지만 서버는 `LATEST`로 받는다
  expect(url.searchParams.get("sort")).toBe("LATEST");
  expect(url.searchParams.get("page")).toBe("2");
  expect(url.searchParams.get("size")).toBe("10");
});

test("상품 후기 목록을 카드 모양으로 옮긴다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(PRODUCT_REVIEWS)));

  const page = await getProductReviews({ productId: "1", sort: "recommend", page: 0, size: 10 });

  expect(page.averageRating).toBe(3.8333333333333335);
  expect(page.totalCount).toBe(12);
  expect(page.reviews[0]).toEqual({
    id: "1",
    nickname: "테스트회원1",
    pets: [
      { id: "101", name: "보리", age: 8, species: "DOG", breedSize: "SMALL" },
      { id: "102", name: "나비", age: 3, species: "CAT", breedSize: null },
    ],
    rating: 4.5,
    date: "2026. 09. 27",
    images: ["https://cdn/a.webp", "https://cdn/b.webp"],
    tags: ["사용 21일"],
    content: "계단 오를 때 덜 힘들어해요.",
    likeCount: 3,
  });
});

// 사진이 없으면 서버가 빈 배열이 아니라 `null`을 준다. 그대로 두면 화면이 `.length`에서 터진다
test("사진이 없는 후기의 images를 빈 배열로 옮긴다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(PRODUCT_REVIEWS)));

  const page = await getProductReviews({ productId: "1", sort: "recommend", page: 0, size: 10 });

  expect(page.reviews[1].images).toEqual([]);
  // 닉네임을 못 찾은 회원은 빈 문자열로 온다. 카드가 이름 줄을 그리지 않는 근거다
  expect(page.reviews[1].nickname).toBe("");
});

test("후기 사진은 쪽 정보를 그대로 넘기고 hasNext를 살려 준다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      totalCount: 6,
      photos: [
        { reviewId: 1, imageUrl: "https://cdn/1-a.webp" },
        { reviewId: 3, imageUrl: "https://cdn/3-a.webp" },
      ],
      hasNext: true,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const page = await getReviewPhotos({ productId: "1", page: 1, size: 30 });

  const url = new URL(String(fetchMock.mock.calls[0]?.[0]), "http://x");
  expect(url.pathname).toContain("/reviews/products/1/photos");
  expect(url.searchParams.get("page")).toBe("1");
  expect(url.searchParams.get("size")).toBe("30");
  expect(page).toEqual({
    totalCount: 6,
    hasNext: true,
    photos: [
      { reviewId: "1", imageUrl: "https://cdn/1-a.webp" },
      { reviewId: "3", imageUrl: "https://cdn/3-a.webp" },
    ],
  });
});

test("대표 사진은 쿼리 없이 부르고 후기 번호를 문자열로 옮긴다", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      Response.json({ photos: [{ reviewId: 7, imageUrl: "https://cdn/7.webp" }] }),
    );
  vi.stubGlobal("fetch", fetchMock);

  const photos = await getFeaturedReviewPhotos("1");

  expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/reviews/products/1/photos/featured");
  expect(photos).toEqual([{ reviewId: "7", imageUrl: "https://cdn/7.webp" }]);
});

test("후기가 없는 상품도 빈 목록으로 옮긴다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ averageRating: 0.0, totalCount: 0, content: [] })),
  );

  const page = await getProductReviews({ productId: "999", sort: "recommend", page: 0, size: 10 });

  expect(page).toEqual({ averageRating: 0, totalCount: 0, reviews: [] });
});
