// 남은 시간이 목록과 함께 움직이는지, 품절을 담을 수 없는지, 담긴 상태가 바뀌는지 본다.
// 딜 데이터를 실제로 조회하고 정렬·거르는 것은 서버 책임이라 여기서 다시 보지 않는다
// (entities/product/api/time-deals.test.ts가 요청 파라미터·매핑을 본다).
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DealItem, TimeDealGroup, TimeDealList } from "@/entities/product";

const { showSnackbar, add, removeAsync, router } = vi.hoisted(() => ({
  showSnackbar: vi.fn(),
  add: vi.fn(),
  removeAsync: vi.fn(),
  // 실제 라우터처럼 렌더마다 같은 객체를 준다. 다시 받기(refresh) 횟수를 센다(QA #84)
  router: { push: vi.fn(), back: vi.fn(), refresh: vi.fn() },
}));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

// 담기·빼기가 서버를 부른다. 이 화면 테스트의 관심은 그 뒤의 표시라 호출만 세운다 (#316)
vi.mock("@/entities/cart", () => ({
  useMutateCartItem: () => ({ add, removeAsync, isAdding: false }),
}));
// 헤더 장바구니는 담은 수를 서버에서 읽는 위젯이다. 여기서는 링크만 대신 그린다(#470)
vi.mock("@/widgets/cart-link", () => ({
  CartLink: () => <a href="/cart" aria-label="장바구니" />,
}));
// 헤더 종은 읽지 않은 알림 수를 서버에서 읽는 위젯이다. 여기서는 링크만 대신 그린다(#588)
vi.mock("@/widgets/notification-bell", () => ({
  NotificationBell: () => <a href="/mypage/notifications" aria-label="알림" />,
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
 *  fake timer로 끝난 시각을 넘기면 끝나는 것까지 같은 시나리오로 확인한다 */
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
          unitLabel: "g",
          unitAmount: 16,
          stock: "low",
        }),
        dealItem({
          timeDealItemId: 2,
          productId: 102,
          name: "데일리 루테인 영양제 30정",
          price: 14_400,
          originalPrice: 18_000,
          discountRate: 20,
          unitLabel: "개",
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
          unitLabel: "개",
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
  onUrlUpdate?: (event: UrlUpdateEvent) => void,
) {
  const view = (upcoming: TimeDealGroup[]) => (
    <NuqsTestingAdapter searchParams={search} onUrlUpdate={onUrlUpdate}>
      <DealsView
        liveDealsPromise={Promise.resolve(toList(liveGroups))}
        upcomingDealsPromise={Promise.resolve(toList(upcoming))}
      />
    </NuqsTestingAdapter>
  );
  let result!: ReturnType<typeof render>;
  await act(async () => {
    // 담기가 서버를 부르게 되면서 이 화면도 Query 컨텍스트를 탄다 (#316)
    result = render(view(upcomingGroups), { wrapper: createQueryWrapper() });
  });
  /** 서버가 다시 준 오픈 예정 목록으로 바꿔 그린다. router.refresh 뒤 새 props가 오는 것을 흉내 낸다 */
  const refetchUpcoming = async (upcoming: TimeDealGroup[]) => {
    await act(async () => {
      result.rerender(view(upcoming));
    });
  };
  return { refetchUpcoming };
}

describe("DealsView", () => {
  // 다른 화면 헤더에는 있는 알림이 타임딜에만 빠져 있었다 (QA No.25, #588)
  it("머리말 오른쪽에 검색·알림·장바구니가 이 순서로 있다", async () => {
    await renderWith();

    const header = screen.getByRole("heading", { name: "타임딜" }).closest("header");
    const links = Array.from(header?.querySelectorAll("a") ?? []).map((link) =>
      link.getAttribute("aria-label"),
    );
    expect(links).toEqual(["검색", "알림", "장바구니"]);
    expect(screen.getByRole("link", { name: "알림" }).getAttribute("href")).toBe(
      "/mypage/notifications",
    );
  });

  it("진행중 탭에 남은 시간과 딜 목록이 있다", async () => {
    await renderWith();

    expect(screen.getByText("종료까지 남은 시간")).toBeDefined();
    expect(screen.getByText("오리&고구마 소형견 사료 1.5kg")).toBeDefined();
  });

  // API가 사진을 주는데 카드가 받지 않아 두 탭 모두 늘 빈 자리였다 (#479)
  it("진행 중인 딜 상품 사진을 그린다", async () => {
    const live = buildLiveGroups();
    live[0].items[0] = { ...live[0].items[0], thumbnailUrl: "https://image.leechs.shop/live.png" };
    await renderWith("", live);

    expect(document.querySelector('img[src*="live.png"]')).not.toBeNull();
  });

  it("오픈 예정 딜 상품 사진을 그린다", async () => {
    const upcoming = buildUpcomingGroups();
    upcoming[0].items[0] = {
      ...upcoming[0].items[0],
      thumbnailUrl: "https://image.leechs.shop/soon.png",
    };
    await renderWith("?tab=upcoming", buildLiveGroups(), upcoming);

    expect(document.querySelector('img[src*="soon.png"]')).not.toBeNull();
  });

  // 서버는 단위 기호와 한 단위의 가격을 준다. 시안(1905-32428)은 "1개당 약 680원"이다 (#479)
  it("단가를 시안처럼 한 단위당 가격으로 보인다", async () => {
    await renderWith();

    expect(screen.getByText("1개당 약 680원")).toBeDefined();
    expect(screen.getByText("1g당 약 16원")).toBeDefined();
  });

  // 딜가는 일반 상품 상세에 오지 않는다. 딜 번호가 없으면 상세가 정가를 보이고 정가로 담긴다 (#484)
  it("썸네일·이름을 누르면 딜 아이템 번호를 들고 상품 상세로 간다", async () => {
    await renderWith();

    const link = screen.getByText("오리&고구마 소형견 사료 1.5kg").closest("a");
    expect(link?.getAttribute("href")).toBe("/products/101?dealItem=1");
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

    // **빼기도 서버를 탄다.** 로컬 목록만 지우면 장바구니에 줄이 남는다 (#316 리뷰)
    expect(
      await screen.findByLabelText("오리&고구마 소형견 사료 1.5kg 장바구니에 담기"),
    ).toBeDefined();
    expect(removeAsync).toHaveBeenCalledWith({ itemType: "TIME_DEAL", itemId: 1 });
  });

  it("수량을 올리면 담기 버튼의 금액도 오른다", async () => {
    await renderWith();

    fireEvent.click(screen.getByLabelText("데일리 루테인 영양제 30정 장바구니에 담기"));
    fireEvent.click(screen.getByLabelText("데일리 루테인 영양제 30정 수량 하나 늘리기"));

    expect(screen.getByRole("button", { name: "28,800원 장바구니 담기" })).toBeDefined();
  });

  // 장바구니에 갔다 뒤로가면 보던 탭 그대로 오고, 한 번 더 뒤로가면 타임딜을 떠나야 한다 (QA #1)
  it("탭을 바꿔도 이력을 쌓지 않는다", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    await renderWith("", undefined, undefined, onUrlUpdate);

    const upcomingTab = screen.getByRole("tab", { name: "오픈 예정" });
    fireEvent.mouseDown(upcomingTab);
    fireEvent.click(upcomingTab);

    await vi.waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const [event] = onUrlUpdate.mock.calls[0];
    expect(event.queryString).toBe("?tab=upcoming");
    expect(event.options.history).toBe("replace");
  });

  // 오픈 예정 카드에 링크가 없어 눌러도 아무 일이 없었다 (QA #94)
  it("오픈 예정 상품을 누르면 딜 번호 없이 상품 상세로 간다", async () => {
    await renderWith("?tab=upcoming");

    const link = screen.getByText("사슴고기&현미 소형견 사료 1.2kg").closest("a");
    expect(link?.getAttribute("href")).toBe("/products/104");
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

    expect(screen.getByText("현재 예정된 타임딜이 없어요")).toBeDefined();
  });

  // 시작 시각이 지나도 오픈 예정에 머물렀다 (QA #84)
  describe("오픈 예정 딜이 열릴 시각이 되면", () => {
    beforeEach(() => {
      router.refresh.mockClear();
      // 렌더가 기다리는 Promise가 멈추지 않게 실제 시간도 흐르게 둔다 (#571)
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function openingIn(ms: number): TimeDealGroup[] {
      const [group] = buildUpcomingGroups();
      return [{ ...group, startAt: new Date(Date.now() + ms).toISOString() }];
    }

    it("진행중 탭을 보고 있어도 목록을 다시 받는다", async () => {
      await renderWith("", undefined, openingIn(60_000));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(59_000);
      });
      expect(router.refresh).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000);
      });
      expect(router.refresh).toHaveBeenCalledTimes(1);
    });

    it("서버가 아직 오픈 예정으로 주면 간격을 두고 다시 받고, 빠지면 멈춘다", async () => {
      const upcoming = openingIn(1_000);
      const { refetchUpcoming } = await renderWith("?tab=upcoming", undefined, upcoming);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000);
      });
      expect(router.refresh).toHaveBeenCalledTimes(1);

      // 서버 전환 작업 전이라 같은 딜이 그대로 온다. 곧바로 또 부르지 않는다
      await refetchUpcoming(upcoming.map((group) => ({ ...group })));
      expect(router.refresh).toHaveBeenCalledTimes(1);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_000);
      });
      expect(router.refresh).toHaveBeenCalledTimes(2);

      // 진행중으로 옮겨 가 오픈 예정에서 빠졌다
      await refetchUpcoming([]);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });
      expect(router.refresh).toHaveBeenCalledTimes(2);
    });
  });

  describe("남은 시간이 다 되면", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("목록 대신 비었다고 알린다", async () => {
      const groups = buildLiveGroups();
      await renderWith("", groups);

      // 카운트다운은 1초 간격이라 딜 길이만큼 감으면 틱이 4만 번 넘게 발화해 느리다(#571).
      // 시계를 끝난 시각 뒤로 옮기고 한 틱만 감는다. 딜 길이가 바뀌어도 그대로 돈다.
      // 타이머가 부르는 상태 갱신이라 act로 감싸야 화면에 반영된다
      vi.setSystemTime(new Date(groups[0].endAt).getTime() + 1);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });

      expect(screen.getByText("지금 진행 중인 타임딜이 없어요")).toBeDefined();
      expect(screen.queryByText("오리&고구마 소형견 사료 1.5kg")).toBeNull();
    });
  });
});
