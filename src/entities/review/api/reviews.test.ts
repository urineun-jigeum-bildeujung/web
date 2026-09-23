// 리뷰 등록·내 후기 조회 테스트. 무엇을 부르고 응답을 화면 모양으로 어떻게 옮기는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import {
  createReview,
  getMyReviews,
  getReviewDetail,
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

test("리뷰 상세를 받아 화면 모양으로 옮기고, 비어 있는 목록은 빈 배열로 둔다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      reviewId: 1,
      isMine: true,
      product: { productId: 1, name: "오메가3 피쉬오일 60캡슐", image: null },
      petId: 3,
      rating: 4,
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
    petId: "3",
    rating: 4,
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
