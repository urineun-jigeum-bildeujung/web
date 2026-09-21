// 남은 시간이 목록과 함께 움직이는지, 품절을 담을 수 없는지, 담긴 상태가 바뀌는지 본다.
// 딜 데이터를 실제로 조회하고 정렬·거르는 것은 서버 책임이라 여기서 다시 보지 않는다
// (entities/product/api/time-deals.test.ts가 요청 파라미터·매핑을 본다).
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DealItem, TimeDealGroup, TimeDealList } from "@/entities/product";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

const { showSnackbar, add } = vi.hoisted(() => ({
  showSnackbar: vi.fn(),
  add: vi.fn(),
}));

// 담기는 서버를 부른다. 이 화면 테스트의 관심은 담긴 뒤의 표시라 호출만 세운다 (#316)
vi.mock("@/entities/cart", () => ({
  useMutateCartItem: () => ({ add, isAdding: false }),
}));
vi.mock("@/shared/ui/snackbar/snackbar", () => ({ showSnackbar }));

import { DealsView } from "./deals-view";

function dealItem(overrides: Partial<DealItem> & Pick<DealItem, "timeDealItemId">): DealItem {
  return {
    productId: overrides.timeDealItemId + 100,
    name: "상품",
    thumbnailUrl: null,
    price: 10_000,
    originalPrice: 10_000,
    discountRate: 0,
    unitLabel: null,
    unitAmount: 0,
    stock: "enough",
    ...overrides,
  };
}

/** 화면에 붙는 순간부터 11시간 28분 43초. 옛 목데이터의 카운트다운 길이를 그대로 옮겼다 —
 *  fake timer로 12시간을 넘기면 끝나는 것까지 같은 시나리오로 확인한다 */
function buildLiveGroups(): TimeDealGroup[] {
  return [
    {
      dealId: 1,
      dealName: "타임딜",
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 11 * 3_600_000 + 28 * 60_000 + 43_000).toISOString(),
      items: [
        dealItem({
          timeDealItemId: 1,
          productId: 101,
          name: "오리&고구마 소형견 사료 1.5kg",
          price: 24_000,
          originalPrice: 32_000,
          discountRate: 25,
          unitLabel: "하루 예상 급여비 약",
          unitAmount: 960,
          stock: "low",
        }),
        dealItem({
          timeDealItemId: 2,
          productId: 102,
          name: "데일리 루테인 영양제 30정",
          price: 14_400,
          originalPrice: 18_000,
          discountRate: 20,
          unitLabel: "1정당 약",
          unitAmount: 480,
          stock: "enough",
        }),
        dealItem({
          timeDealItemId: 3,
          productId: 103,
          name: "황태 단호박 미니 큐브 20개입",
          price: 13_600,
          originalPrice: 16_000,
          discountRate: 15,
          unitLabel: "1개당 약",
          unitAmount: 680,
          stock: "none",
        }),
      ],
    },
  ];
}

/** 내일 정각 10시. formatOpenAt이 "시"만 읽고 분은 안 읽는지 보는 테스트가 기댄다 */
function buildUpcomingGroups(): TimeDealGroup[] {
  const startAt = new Date();
  startAt.setDate(startAt.getDate() + 1);
  startAt.setHours(10, 0, 0, 0);
  return [
    {
      dealId: 2,
      dealName: "다음 타임딜",
      startAt: startAt.toISOString(),
      endAt: startAt.toISOString(),
      items: [
        dealItem({
          timeDealItemId: 4,
          productId: 104,
          name: "사슴고기&현미 소형견 사료 1.2kg",
          discountRate: 22,
        }),
      ],
    },
  ];
}

function toList(groups: TimeDealGroup[]): TimeDealList {
  return { groups, serverTime: new Date().toISOString() };
}

// use()가 첫 렌더에서 항상 한 번 suspend했다가 promise가 풀리면 다시 그린다 — 이미
// resolve된 promise를 넘겨도 마찬가지라, act()로 감싸 그 재렌더까지 기다리고 반환한다
async function renderWith(
  search = "",
  liveGroups: TimeDealGroup[] = buildLiveGroups(),
  upcomingGroups: TimeDealGroup[] = buildUpcomingGroups(),
) {
  await act(async () => {
    render(
      <NuqsTestingAdapter searchParams={search}>
        <DealsView
          liveDealsPromise={Promise.resolve(toList(liveGroups))}
          upcomingDealsPromise={Promise.resolve(toList(upcomingGroups))}
        />
      </NuqsTestingAdapter>,
      // 담기가 서버를 부르게 되면서 이 화면도 Query 컨텍스트를 탄다 (#316)
      { wrapper: createQueryWrapper() },
    );
  });
}

describe("DealsView", () => {
  it("진행중 탭에 남은 시간과 딜 목록이 있다", async () => {
    await renderWith();

    expect(screen.getByText("종료까지 남은 시간")).toBeDefined();
    expect(screen.getByText("오리&고구마 소형견 사료 1.5kg")).toBeDefined();
  });

  it("썸네일·이름을 누르면 상품 상세로 가는 링크다", async () => {
    await renderWith();

    const link = screen.getByText("오리&고구마 소형견 사료 1.5kg").closest("a");
    expect(link?.getAttribute("href")).toBe("/products/101");
  });

  it("품절인 딜은 담을 수 없다", async () => {
    await renderWith();

    const soldOut = screen.getByLabelText("황태 단호박 미니 큐브 20개입 품절");
    expect(soldOut.hasAttribute("disabled")).toBe(true);
  });

  it("담으면 그 딜이 담긴 것으로 바뀐다", async () => {
    await renderWith();

    fireEvent.click(screen.getByLabelText("오리&고구마 소형견 사료 1.5kg 장바구니에 담기"));
    // 시트의 담기 버튼은 금액을 함께 읽힌다(기본 수량 1개 기준 목록가)
    fireEvent.click(screen.getByRole("button", { name: "24,000원 장바구니 담기" }));

    // 담기가 서버를 기다린다. 응답이 온 뒤에 담긴 표시로 바뀐다 (#316)
    expect(
      await screen.findByLabelText("오리&고구마 소형견 사료 1.5kg 장바구니에서 빼기"),
    ).toBeDefined();
    expect(add).toHaveBeenCalledWith({ itemType: "TIME_DEAL", itemId: 1 }, 1);
    expect(showSnackbar).toHaveBeenCalledWith("장바구니에 담겼어요");
  });

  it("이미 담긴 딜을 다시 누르면 시트를 열지 않고 바로 뺀다", async () => {
    await renderWith();

    fireEvent.click(screen.getByLabelText("오리&고구마 소형견 사료 1.5kg 장바구니에 담기"));
    fireEvent.click(screen.getByRole("button", { name: "24,000원 장바구니 담기" }));

    // 담기가 서버를 기다린다 (#316)
    fireEvent.click(
      await screen.findByLabelText("오리&고구마 소형견 사료 1.5kg 장바구니에서 빼기"),
    );

    expect(screen.getByLabelText("오리&고구마 소형견 사료 1.5kg 장바구니에 담기")).toBeDefined();
  });

  it("수량을 올리면 담기 버튼의 금액도 오른다", async () => {
    await renderWith();

    fireEvent.click(screen.getByLabelText("데일리 루테인 영양제 30정 장바구니에 담기"));
    fireEvent.click(screen.getByLabelText("데일리 루테인 영양제 30정 수량 하나 늘리기"));

    expect(screen.getByRole("button", { name: "28,800원 장바구니 담기" })).toBeDefined();
  });

  it("오픈 예정 탭은 정각 시각을 '시'로 읽고 분은 적지 않는다", async () => {
    await renderWith("?tab=upcoming");

    expect(screen.getByText(/(오전|오후) \d+시에 봬요!/)).toBeDefined();
    expect(screen.queryByText(/:00/)).toBeNull();
  });

  it("오픈 예정 탭에서 알림을 신청하면 신청된 상태로 남고, 다시 누르면 취소된다", async () => {
    await renderWith("?tab=upcoming");

    fireEvent.click(screen.getByRole("button", { name: "오픈 알림 신청하기" }));

    expect(screen.getByText("오픈 알림 신청됨")).toBeDefined();
    expect(screen.queryByRole("button", { name: "오픈 알림 신청하기" })).toBeNull();
    // 취소할 수도 있으니 신청 후에도 남은 시간은 계속 보여준다
    expect(screen.getByText(/\d{2} : \d{2} : \d{2}/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "오픈 알림 신청 취소하기" }));

    expect(screen.getByRole("button", { name: "오픈 알림 신청하기" })).toBeDefined();
    expect(screen.queryByText("오픈 알림 신청됨")).toBeNull();
  });

  it("딜 묶음이 여러 개면 전부 그린다", async () => {
    const groups = buildLiveGroups();
    const secondGroup: TimeDealGroup = {
      dealId: 99,
      dealName: "특별 프로모션",
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 3_600_000).toISOString(),
      items: [dealItem({ timeDealItemId: 9, productId: 900, name: "특가 상품" })],
    };
    await renderWith("", [...groups, secondGroup]);

    expect(screen.getByText("오리&고구마 소형견 사료 1.5kg")).toBeDefined();
    expect(screen.getByText("특가 상품")).toBeDefined();
    expect(screen.getAllByText("종료까지 남은 시간")).toHaveLength(2);
  });

  it("진행중 딜이 없으면(빈 배열) 없다고 알린다", async () => {
    await renderWith("", []);

    expect(screen.getByText("지금 진행 중인 타임딜이 없어요")).toBeDefined();
  });

  it("오픈 예정 딜이 없으면(빈 배열) 없다고 알린다", async () => {
    await renderWith("?tab=upcoming", undefined, []);

    expect(screen.getByText("오픈 예정인 타임딜이 없어요")).toBeDefined();
  });

  describe("남은 시간이 다 되면", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("목록 대신 비었다고 알린다", async () => {
      await renderWith();

      // 화면에 붙는 순간부터 11시간 28분 43초라 그만큼 넘긴다.
      // 타이머가 부르는 상태 갱신이라 act로 감싸야 화면에 반영된다
      await act(async () => {
        await vi.advanceTimersByTimeAsync(12 * 3_600_000);
      });

      expect(screen.getByText("지금 진행 중인 타임딜이 없어요")).toBeDefined();
      expect(screen.queryByText("오리&고구마 소형견 사료 1.5kg")).toBeNull();
    });
  });
});
