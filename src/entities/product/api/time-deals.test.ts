// getTimeDeals 단위 테스트. 요청 파라미터 조립과 응답 필드 매핑을 본다.
import { afterEach, describe, expect, it, vi } from "vitest";

import { getTimeDeals } from "./time-deals";

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("getTimeDeals", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("status를 쿼리로 보내고 인증 헤더를 붙이지 않는다", async () => {
    const fetchMock = stubFetch(Response.json({ deals: [], serverTime: "2026-09-21T00:00:00Z" }));

    await getTimeDeals("ACTIVE");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/time-deals?status=ACTIVE");
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });

  it("딜 묶음을 배열 그대로 보존하고 stockBadge·필드명을 화면 모델로 옮긴다", async () => {
    stubFetch(
      Response.json({
        deals: [
          {
            dealId: 1,
            dealName: "9월 넷째 주 타임딜",
            startAt: "2026-09-25T00:00:00+09:00",
            endAt: "2026-09-25T10:00:00+09:00",
            items: [
              {
                productId: 101,
                timeDealItemId: 501,
                thumbnailUrl: null,
                productName: "오리&고구마 소형견 사료 1.5kg",
                normalPrice: 32000,
                discountedPrice: 24000,
                discountRate: 25,
                unitPrice: 960,
                unitLabel: "1kg당",
                stockBadge: "LOW_STOCK",
              },
            ],
          },
          {
            dealId: 2,
            dealName: "특별 프로모션",
            startAt: "2026-09-25T00:00:00+09:00",
            endAt: "2026-09-26T00:00:00+09:00",
            items: [],
          },
        ],
        serverTime: "2026-09-21T00:00:00Z",
      }),
    );

    const result = await getTimeDeals("ACTIVE");

    // 백엔드가 dealId 개수를 제한하지 않으므로, 여러 묶음이 와도 전부 보존한다
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0]).toEqual({
      dealId: 1,
      dealName: "9월 넷째 주 타임딜",
      startAt: "2026-09-25T00:00:00+09:00",
      endAt: "2026-09-25T10:00:00+09:00",
      items: [
        {
          timeDealItemId: 501,
          productId: 101,
          name: "오리&고구마 소형견 사료 1.5kg",
          thumbnailUrl: null,
          price: 24000,
          originalPrice: 32000,
          discountRate: 25,
          unitLabel: "1kg당",
          unitAmount: 960,
          stock: "low",
        },
      ],
    });
    expect(result.serverTime).toBe("2026-09-21T00:00:00Z");
  });

  it("stockBadge NONE(배지 없음)은 화면의 enough로, SOLD_OUT은 none으로 옮긴다", async () => {
    stubFetch(
      Response.json({
        deals: [
          {
            dealId: 1,
            dealName: "딜",
            startAt: "2026-09-25T00:00:00+09:00",
            endAt: "2026-09-25T10:00:00+09:00",
            items: [
              {
                productId: 1,
                timeDealItemId: 1,
                thumbnailUrl: null,
                productName: "충분 재고",
                normalPrice: 1000,
                discountedPrice: 900,
                discountRate: 10,
                unitPrice: 900,
                unitLabel: null,
                stockBadge: "NONE",
              },
              {
                productId: 2,
                timeDealItemId: 2,
                thumbnailUrl: null,
                productName: "품절",
                normalPrice: 1000,
                discountedPrice: 900,
                discountRate: 10,
                unitPrice: 900,
                unitLabel: null,
                stockBadge: "SOLD_OUT",
              },
            ],
          },
        ],
        serverTime: "2026-09-21T00:00:00Z",
      }),
    );

    const result = await getTimeDeals("ACTIVE");

    expect(result.groups[0].items[0].stock).toBe("enough");
    expect(result.groups[0].items[0].unitLabel).toBeNull();
    expect(result.groups[0].items[1].stock).toBe("none");
  });
});
