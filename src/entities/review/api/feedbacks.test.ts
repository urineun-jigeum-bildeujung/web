// 반응 조회·등록 테스트. 응답을 화면 모양으로 옮기는 것과 보류·답변이 어떻게 실리는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import { getPendingFeedbacks, submitFeedback } from "./feedbacks";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("남길 수 있는 항목을 화면 모양으로 옮기고 사진·아이가 없으면 그대로 비운다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        content: [
          {
            orderProductId: 12,
            productId: 7,
            productName: "오메가3 피쉬오일 60캡슐",
            thumbnailUrl: null,
            checkAvailableAt: "2026-09-20T00:00:00Z",
            petId: null,
          },
          {
            orderProductId: 13,
            productId: 8,
            productName: "저자극 덴탈껌",
            thumbnailUrl: "https://image.leechs.shop/products/8/a.jpg",
            checkAvailableAt: "2026-09-20T00:00:00Z",
            petId: 3,
          },
        ],
      }),
    ),
  );

  const items = await getPendingFeedbacks();

  expect(items).toEqual([
    { orderProductId: "12", productId: "7", name: "오메가3 피쉬오일 60캡슐", petId: null },
    {
      orderProductId: "13",
      productId: "8",
      name: "저자극 덴탈껌",
      imageUrl: "https://image.leechs.shop/products/8/a.jpg",
      petId: "3",
    },
  ]);
  // 사진이 없으면 키 자체를 두지 않는다. undefined가 들어가면 화면이 있는 줄 안다
  expect("imageUrl" in items[0]).toBe(false);
});

test("답을 고르면 answer와 함께, 보류면 postpone만 보낸다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);

  await submitFeedback({ productId: "7", orderProductId: "12", submission: { answer: "GOOD" } });
  await submitFeedback({ productId: "7", orderProductId: "12", submission: { postpone: true } });

  const [answerUrl, answerInit] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(answerUrl).toContain("/reviews/products/7/feedbacks");
  expect(answerInit.method).toBe("POST");
  expect(JSON.parse(String(answerInit.body))).toEqual({
    orderProductId: 12,
    postpone: false,
    answer: "GOOD",
  });

  const [, postponeInit] = fetchMock.mock.calls[1] as [string, RequestInit];
  expect(JSON.parse(String(postponeInit.body))).toEqual({ orderProductId: 12, postpone: true });
});
