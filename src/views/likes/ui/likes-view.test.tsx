// 탭마다 무엇이 붙는지, 찜 탭이 카테고리별로 서버에서 목록을 받아오는지 본다.
//
// **목이 서버처럼 상태를 든다.** 찜 해제는 낙관적으로 먼저 캐시에서 뺀 뒤 다시
// 조회해 맞추는데, 목이 늘 같은 값을 돌려주면 그 조회가 방금 뺀 것을 되돌린다.
// 목을 고쳐 쓰게 해 두고, 카테고리별 필터링도 서버가 하는 것과 같은 규칙으로 흉내낸다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getWishlist, toggleWishlist } = vi.hoisted(() => ({
  getWishlist: vi.fn(),
  toggleWishlist: vi.fn(),
}));

// 헤더 종은 서버 상태를 읽는 위젯이다. 이 화면 테스트에는 QueryClient가 없어 링크만 대신 그린다(#395)
vi.mock("@/widgets/notification-bell", () => ({
  NotificationBell: ({ className }: { className?: string }) => (
    <a href="/mypage/notifications" aria-label="알림" className={className} />
  ),
  NewNotificationToaster: () => null,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/likes",
}));

vi.mock("@/entities/wishlist/api/wishlist", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/wishlist/api/wishlist")>()),
  getWishlist,
  toggleWishlist,
}));

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

import { LikesView } from "./likes-view";

/** 서버가 들고 있는 것. 실제 응답엔 category가 없지만, 목은 필터링을 흉내내려고 든다 */
type StoredItem = {
  productId: number;
  name: string;
  price: number;
  originalPrice: number;
  category: "FOOD" | "TREAT" | "SUPPLEMENT";
};

// 할인하지 않는 상품은 정가가 판매가와 같은 값으로 온다(백엔드 확인) — 사료A만 할인 중이다
const ITEMS: StoredItem[] = [
  { productId: 1, name: "사료A", price: 25600, originalPrice: 32000, category: "FOOD" },
  { productId: 2, name: "간식B", price: 31200, originalPrice: 31200, category: "TREAT" },
  { productId: 3, name: "영양제C", price: 31200, originalPrice: 31200, category: "SUPPLEMENT" },
  { productId: 4, name: "사료D", price: 31200, originalPrice: 31200, category: "FOOD" },
];

let stored: StoredItem[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  stored = ITEMS.map((item) => ({ ...item }));

  getWishlist.mockImplementation(async (categoryCode?: string) =>
    stored
      .filter((item) => !categoryCode || item.category === categoryCode)
      .map(({ productId, name, price, originalPrice }) => ({
        productId,
        name,
        thumbnailUrl: null,
        price,
        originalPrice,
      })),
  );

  toggleWishlist.mockImplementation(async (productId: number) => {
    stored = stored.filter((item) => item.productId !== productId);
    return { wished: false };
  });
});

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <LikesView />
    </NuqsTestingAdapter>,
    { wrapper: createQueryWrapper() },
  );
}

describe("LikesView", () => {
  it("찜 탭에 카테고리 거르기가 있다", async () => {
    renderWith();
    expect(await screen.findByLabelText("상품 분류")).toBeDefined();
  });

  it("찜 탭에서 사료만 고르면 그것만 남는다", async () => {
    renderWith("?tab=liked&category=food");

    expect(await screen.findAllByRole("listitem")).toHaveLength(2);
    // 서버가 이미 걸렀으므로 category=FOOD로 요청했는지도 본다
    await waitFor(() => expect(getWishlist).toHaveBeenCalledWith("FOOD"));
  });

  // 응답에 category가 없어 전체 조회를 따로 켜 두지만(빈 상태 구분용), all일 때
  // 카테고리 조회까지 함께 나가면 같은 요청이 중복된다
  it("all일 때는 전체 조회만 나가고 카테고리 조회는 나가지 않는다", async () => {
    renderWith("?tab=liked");
    await screen.findAllByRole("listitem");

    expect(getWishlist).toHaveBeenCalledTimes(1);
    expect(getWishlist).toHaveBeenCalledWith(undefined);
  });

  // 카테고리를 고르면 전체 조회(빈 상태 판단용)와 카테고리 조회가 각각 다른
  // query key로 함께 나간다 — 서로 캐시가 섞이면 안 된다
  it("카테고리를 고르면 전체 조회와 카테고리 조회가 각각 나간다", async () => {
    renderWith("?tab=liked&category=food");
    await screen.findAllByRole("listitem");

    expect(getWishlist).toHaveBeenCalledWith(undefined);
    expect(getWishlist).toHaveBeenCalledWith("FOOD");
    expect(getWishlist).toHaveBeenCalledTimes(2);
  });

  it("주소에 없는 카테고리가 오면 전체로 떨어진다", async () => {
    renderWith("?tab=liked&category=legacy");

    expect(await screen.findAllByRole("listitem")).toHaveLength(4);
  });

  it("최근에 봤어요·자주 샀어요 탭은 눌러도 반응하지 않는다", async () => {
    renderWith();
    await screen.findByLabelText("상품 분류");

    fireEvent.click(screen.getByRole("tab", { name: "최근에 봤어요" }));
    fireEvent.click(screen.getByRole("tab", { name: "자주 샀어요" }));

    // MVP 범위 밖이라 탭 전환 없이 찜 탭 내용이 그대로 남는다
    expect(screen.getByLabelText("상품 분류")).toBeDefined();
  });

  // disabled는 클릭만 막는다. 주소로 ?tab=recent를 직접 치고 들어오는 건 별도로 막아야
  // 한다(CodeRabbit 지적) — tab 쿼리 파서가 liked 밖의 값을 안 받게 좁혔다
  it("주소로 최근에 봤어요·자주 샀어요에 들어가도 찜 탭으로 떨어진다", async () => {
    renderWith("?tab=recent");

    expect(screen.queryByLabelText(/목록에서 빼기/)).toBeNull();
    expect(await screen.findByLabelText("상품 분류")).toBeDefined();
  });

  // 최근에 봤어요·자주 샀어요는 탭도 주소도 막혀 있어 그 안의 목록·지우기 로직(코드에는
  // 남아 있다)을 사용자 관점에서 도달할 방법이 없다 — 재활성화 전까지는 직접 테스트하지 않는다

  it("찜을 풀면 확인 없이 바로 목록에서 빠진다", async () => {
    renderWith("?tab=liked");
    await screen.findAllByRole("listitem");

    // 취소 기능이 없어 확인 모달이 뜨면 오히려 방해된다는 판단으로 뺐다(#274 QA 답변)
    fireEvent.click(screen.getAllByLabelText(/찜 풀기/)[0]);

    expect(screen.queryByRole("button", { name: "지우기" })).toBeNull();
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(3));
  });

  // 실패해도 낙관적으로 먼저 빠지는 순간은 지나가지만(useMutateWishlist), 값이 바로
  // 되돌아와 화면에서 관찰하기엔 너무 빠르다 — 최종 상태(원래대로 복구)만 본다
  it("찜 해제가 실패하면 목록으로 되돌아온다", async () => {
    toggleWishlist.mockRejectedValueOnce(new Error("네트워크 오류"));
    renderWith("?tab=liked");
    await screen.findAllByRole("listitem");

    fireEvent.click(screen.getAllByLabelText(/찜 풀기/)[0]);

    await waitFor(() => expect(toggleWishlist).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(4));
  });

  // 정가는 없을 수도, 판매가와 같을 수도 있다 — 둘 다 할인이 아니다
  it("할인 중인 상품에만 정가 취소선과 할인율을 보여준다", async () => {
    const { container } = renderWith("?tab=liked");
    await screen.findAllByRole("listitem");

    // 넷 중 사료A만 32,000원 → 25,600원(20%)이다. 나머지 셋은 정가가 판매가와 같아 할인이 아니다
    expect(container.querySelectorAll(".line-through")).toHaveLength(1);
    expect(screen.getByText("32,000원")).toBeDefined();
    expect(screen.getByText("20%")).toBeDefined();
  });

  // 빈 상태 시안(2022-158710)엔 칩 줄이 없다. 거른 결과가 빈 것과는 다르다
  it("찜한 상품이 하나도 없으면 카테고리 칩도 감춘다", async () => {
    renderWith("?tab=liked");
    await screen.findAllByRole("listitem");

    for (const button of screen.getAllByLabelText(/찜 풀기/)) {
      fireEvent.click(button);
    }

    await waitFor(() => expect(screen.queryByLabelText("상품 분류")).toBeNull());
    expect(screen.getByText("아직 담아둔 상품이 없어요")).toBeDefined();
  });

  // 고른 카테고리에만 없는 것과 찜 목록 자체가 빈 것은 다르다(CodeRabbit 지적) — 전자에
  // "아직 담아둔 상품이 없어요"를 그대로 쓰면 다른 칩엔 상품이 있는데도 다 지운 것처럼 읽힌다
  it("찜한 상품은 있는데 고른 카테고리에만 없으면 문구가 다르다", async () => {
    renderWith("?tab=liked&category=food");

    // 사료 둘을 다 풀어도 찜 목록엔 간식·영양제 상품이 남는다
    for (const button of await screen.findAllByLabelText(/찜 풀기/)) {
      fireEvent.click(button);
    }

    expect(await screen.findByText("이 카테고리엔 담아둔 상품이 없어요")).toBeDefined();
    expect(screen.getByLabelText("상품 분류")).toBeDefined();
  });

  it("조회에 실패하면 안내와 다시 시도 버튼을 보여준다", async () => {
    getWishlist.mockRejectedValue(new Error("네트워크 오류"));
    renderWith("?tab=liked");

    expect(await screen.findByRole("button", { name: "다시 시도" })).toBeDefined();
  });

  // 버튼이 뜨는 것과 실제로 재조회에 성공해 회복하는 것은 다른 이야기다
  it("다시 시도를 누르면 실제로 다시 조회해 목록을 보여준다", async () => {
    getWishlist.mockRejectedValueOnce(new Error("네트워크 오류"));
    renderWith("?tab=liked");

    fireEvent.click(await screen.findByRole("button", { name: "다시 시도" }));

    expect(await screen.findAllByRole("listitem")).toHaveLength(4);
  });

  // 선택 카테고리 화면은 전체 조회(빈 상태 판단용)와 카테고리 조회(실제 목록) 둘 다
  // 있어야 정확하다 — 하나만 실패해도 나머지로 정상인 척하지 않는다
  it("선택 카테고리에서 전체 조회만 실패해도 오류 UI를 보여준다", async () => {
    getWishlist.mockImplementation(async (categoryCode?: string) => {
      if (categoryCode === undefined) throw new Error("전체 조회 실패");
      return stored
        .filter((item) => item.category === categoryCode)
        .map(({ productId, name, price }) => ({ productId, name, thumbnailUrl: null, price }));
    });

    renderWith("?tab=liked&category=food");

    expect(await screen.findByRole("button", { name: "다시 시도" })).toBeDefined();
    expect(screen.queryByText("사료A")).toBeNull();
  });

  it("선택 카테고리에서 카테고리 조회만 실패해도 오류 UI를 보여준다", async () => {
    getWishlist.mockImplementation(async (categoryCode?: string) => {
      if (categoryCode === "FOOD") throw new Error("카테고리 조회 실패");
      return stored.map(({ productId, name, price }) => ({
        productId,
        name,
        thumbnailUrl: null,
        price,
      }));
    });

    renderWith("?tab=liked&category=food");

    expect(await screen.findByRole("button", { name: "다시 시도" })).toBeDefined();
  });

  it("재시도하면 전체·카테고리 조회가 모두 다시 나가 정상 화면으로 회복한다", async () => {
    getWishlist.mockRejectedValueOnce(new Error("전체 조회 실패")); // 첫 all 호출만 실패
    renderWith("?tab=liked&category=food");

    fireEvent.click(await screen.findByRole("button", { name: "다시 시도" }));

    expect(await screen.findAllByRole("listitem")).toHaveLength(2);
    // all·FOOD 둘 다 최소 두 번(최초 시도 + 재시도)씩 나갔어야 한다
    await waitFor(() => {
      const allCalls = getWishlist.mock.calls.filter((call) => call[0] === undefined).length;
      const foodCalls = getWishlist.mock.calls.filter((call) => call[0] === "FOOD").length;
      expect(allCalls).toBeGreaterThanOrEqual(2);
      expect(foodCalls).toBeGreaterThanOrEqual(2);
    });
  });

  // all에서는 categoryQuery가 꺼져 있으니 그 실패 여부는 화면 상태 판단에서 빠져야 한다
  it("all에서는 카테고리 조회가 실패한 채로 남아 있어도 화면에 영향이 없다", async () => {
    getWishlist.mockImplementation(async (categoryCode?: string) => {
      if (categoryCode === "FOOD") throw new Error("카테고리 조회 실패");
      return stored.map(({ productId, name, price }) => ({
        productId,
        name,
        thumbnailUrl: null,
        price,
      }));
    });

    renderWith("?tab=liked&category=food");
    // food에서는 실제로 오류 UI가 뜬다(위 테스트와 같은 상황)
    await screen.findByRole("button", { name: "다시 시도" });

    // 전체 칩을 눌러 all로 돌아온다 — food 쿼리는 비활성화되지만 캐시엔 실패 상태가 남는다
    fireEvent.click(screen.getByRole("radio", { name: "전체" }));

    // all은 전체 조회만 보므로 정상 화면으로 돌아와야 한다
    expect(await screen.findAllByRole("listitem")).toHaveLength(4);
    expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull();
  });

  // 캐시에 데이터가 있는 채로 백그라운드 재조회만 실패하면 화면을 막지 않는다
  // (items === undefined일 때만 차단 오류로 본다) — 창 포커스가 기본 재조회
  // 트리거라 이를 흉내내 배경 재조회를 일으킨다
  it("캐시가 있는 채로 백그라운드 재조회만 실패하면 기존 목록과 칩을 유지한다", async () => {
    renderWith("?tab=liked");
    await screen.findAllByRole("listitem");
    const callsBeforeRefetch = getWishlist.mock.calls.length;

    // 이후 백그라운드 재조회가 실패하도록 바꾸고, 창 포커스로 재조회를 일으킨다
    getWishlist.mockRejectedValue(new Error("네트워크 오류"));
    fireEvent(window, new Event("visibilitychange"));
    fireEvent(window, new Event("focus"));

    // 재조회가 실제로 한 번 더 나갔는지 확인한다(안 그러면 아래 검증이 첫 로딩만
    // 보고 통과해버릴 수 있다)
    await waitFor(() => expect(getWishlist.mock.calls.length).toBeGreaterThan(callsBeforeRefetch));
    // 데이터는 이미 있으므로(items !== undefined) 오류 화면으로 바뀌지 않는다
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByLabelText("상품 분류")).toBeDefined();
  });

  // 첫 그림은 뼈대가 자리를 잡아야 레이아웃이 밀리지 않는다(AGENTS.md 5.8)
  it("처음 불러올 때 스켈레톤을 보여준다", async () => {
    let resolveWishlist!: (value: Awaited<ReturnType<typeof getWishlist>>) => void;
    getWishlist.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWishlist = resolve;
        }),
    );
    renderWith("?tab=liked");

    expect(await screen.findByText("찜한 상품을 불러오는 중")).toBeDefined();

    resolveWishlist(
      ITEMS.map(({ productId, name, price, originalPrice }) => ({
        productId,
        name,
        thumbnailUrl: null,
        price,
        originalPrice,
      })),
    );
    expect(await screen.findAllByRole("listitem")).toHaveLength(4);
  });

  // 시안(header, 1585:18342)은 뒤로가기 화살표 + 검색·알림·장바구니고 제목이 없다(#274).
  // 바텀내비 탭 루트라 로고형일 거라 짐작했던 게 틀렸다는 것을 여기서 고정해 둔다
  it("머리말에 뒤로가기가 있고 검색·알림·장바구니로 이동한다", async () => {
    renderWith();

    expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeDefined();
    expect(screen.getByRole("link", { name: "검색" }).getAttribute("href")).toBe("/search");
    expect(screen.getByRole("link", { name: "알림" }).getAttribute("href")).toBe(
      "/mypage/notifications",
    );
    expect(screen.getByRole("link", { name: "장바구니" }).getAttribute("href")).toBe("/cart");
  });

  it("하단 이동 줄에서 현재 화면을 알린다", async () => {
    renderWith();

    const current = screen.getByRole("link", { name: "좋아요" });
    expect(current.getAttribute("aria-current")).toBe("page");
  });
});
