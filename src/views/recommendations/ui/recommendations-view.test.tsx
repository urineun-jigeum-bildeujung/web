// 적합도가 점수만이 아니라 문장으로도 읽히는지, 아이를 바꿀 수 있는지 본다.
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/recommendations",
}));

// 헤더 위젯은 서버 상태를 읽는다. 이 화면 테스트에는 QueryClient가 없어 링크만 대신 그린다
vi.mock("@/widgets/notification-bell", () => ({
  NotificationBell: () => <a href="/mypage/notifications" aria-label="알림" />,
}));
vi.mock("@/widgets/cart-link", () => ({
  CartLink: () => <a href="/cart" aria-label="장바구니" />,
}));

// 아이는 마이페이지와 같은 실제 목록이다(#470). 받은 인자도 적어 두어, 로그인 여부를 조회에
// 넘기는지 본다 — 목이 인자를 버리면 게이트를 지워도 테스트가 통과한다(#470 리뷰)
const PETS = [
  { id: "3", name: "초코", isDefault: true },
  { id: "7", name: "구름", isDefault: false },
];
let petsQuery: { pets: unknown; isLoading: boolean } = { pets: PETS, isLoading: false };
let petsCalls: unknown[] = [];
vi.mock("@/entities/pet", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/pet")>()),
  useQueryPets: (options: unknown) => {
    petsCalls.push(options);
    return petsQuery;
  },
}));

// 로그인 여부. 서버 렌더·하이드레이션 중에는 모른다(null)
const session: { value: boolean | null } = { value: true };
vi.mock("@/shared/api/use-session-state", () => ({ useSessionState: () => session.value }));

import { RecommendationsView } from "./recommendations-view";

afterEach(() => {
  petsQuery = { pets: PETS, isLoading: false };
  petsCalls = [];
  session.value = true;
});

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <RecommendationsView />
    </NuqsTestingAdapter>,
  );
}

describe("RecommendationsView", () => {
  it("어느 아이 기준인지 고를 수 있다", () => {
    renderWith();
    expect(screen.getByLabelText("어느 아이의 추천을 볼지")).toBeDefined();
  });

  it("주소로 받은 아이가 적합도 문장에 들어간다", () => {
    renderWith("?pet=7");

    // 점수만 보여주면 누구 기준인지 알 수 없다. 받침 있는 이름에는 과가 붙는다
    expect(screen.getAllByText(/구름과 적합도 \d+점/)[0]).toBeDefined();
  });

  // 예시 이름(코코)을 쓰던 동안 마이페이지의 실제 이름과 달랐다(QA 1차 6번, #470).
  // 기본 아이를 둘째에 두어야 "첫 아이로 되돌림"과 갈린다(#470 리뷰)
  it("주소에 아이가 없거나 목록에 없으면 첫 아이가 아니라 기본 아이 기준이다", () => {
    petsQuery = {
      pets: [
        { id: "3", name: "초코", isDefault: false },
        { id: "7", name: "구름", isDefault: true },
      ],
      isLoading: false,
    };
    renderWith("?pet=999");

    expect(screen.getAllByText(/구름과 적합도 \d+점/)[0]).toBeDefined();
  });

  it("로그인했을 때만 아이 목록을 부른다", () => {
    session.value = false;
    const { unmount } = renderWith();
    expect(petsCalls.at(-1)).toEqual({ enabled: false });
    unmount();

    session.value = true;
    renderWith();
    expect(petsCalls.at(-1)).toEqual({ enabled: true });
  });

  it("아이 목록을 받는 동안 아이 알약 자리를 잡아 둔다", () => {
    petsQuery = { pets: undefined, isLoading: true };
    renderWith();

    expect(screen.getByRole("status", { name: "아이 목록을 불러오는 중" })).toBeDefined();
  });

  it("로그인 여부를 아직 모르면 아이 알약 자리를 잡아 둔다", () => {
    session.value = null;
    petsQuery = { pets: undefined, isLoading: false };
    renderWith();

    expect(screen.getByRole("status", { name: "아이 목록을 불러오는 중" })).toBeDefined();
    expect(petsCalls.at(-1)).toEqual({ enabled: false });
  });

  it("로그인하지 않았으면 고르는 알약 없이 우리 아이로 읽는다", () => {
    session.value = false;
    petsQuery = { pets: undefined, isLoading: false };
    renderWith();

    expect(screen.queryByLabelText("어느 아이의 추천을 볼지")).toBeNull();
    expect(screen.getByRole("heading", { name: "우리 아이의 건강 고민을 덜어줄" })).toBeDefined();
  });

  // 알약이 이름만큼 넓어져 뒤 문장 "의 건강 고민을 덜어줄"이 두 줄로 밀렸다(QA 신규-줄바꿈, #599).
  // 줄 높이는 jsdom이 재지 못해 알약이 이름을 자르고 문장은 줄지 않는지만 본다
  it("긴 이름은 알약 안에서 한 줄 말줄임으로 자르고 전체 이름은 title로 남긴다", () => {
    const name = "초코바나나딸기우유맛쿠키";
    petsQuery = { pets: [{ id: "3", name, isDefault: true }], isLoading: false };
    renderWith();

    const picker = screen.getByRole("combobox", { name: "어느 아이의 추천을 볼지" });
    expect(picker.getAttribute("title")).toBe(name);
    const label = screen.getByText(name);
    expect(picker.contains(label)).toBe(true);
    expect(label.className).toContain("truncate");
    expect(screen.getByRole("heading", { name: "의 건강 고민을 덜어줄" }).className).toContain(
      "shrink-0",
    );
  });

  it("무엇을 근거로 골랐는지 알린다", () => {
    renderWith();
    expect(screen.getByText(/건강 고민을 바탕으로 추천해요/)).toBeDefined();
  });

  it("분류를 바꾸면 목록도 바뀐다", () => {
    const { unmount } = renderWith("?category=food");
    const food = screen.getAllByRole("listitem").map((el) => el.textContent);
    unmount();

    renderWith("?category=snack");
    const snack = screen.getAllByRole("listitem").map((el) => el.textContent);

    // 탭을 눌러도 같은 목록이면 거른 것이 아니다
    expect(food).not.toEqual(snack);
  });

  it("전체 탭은 모든 분류를 보여준다", () => {
    const { unmount } = renderWith("?category=food");
    const food = screen.getAllByRole("listitem").length;
    unmount();

    renderWith("?category=all");
    const all = screen.getAllByRole("listitem").length;

    expect(all).toBeGreaterThan(food);
  });

  // 메인 "맞춤 추천" 더보기로 들어오는 서브 화면이라 뒤로가기가 있어야 한다.
  // 시안 헤더(로고형)와 다르게 유지하기로 한 것을 여기서 고정해 둔다(#273)
  it("머리말에 뒤로가기와 제목이 있다", () => {
    renderWith();
    expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "맞춤 추천" })).toBeDefined();
  });

  // 시안의 검색·알림·장바구니가 이 헤더에만 빠져 있었다(QA 1차 2번, #470)
  it("머리말 오른쪽에 검색·알림·장바구니가 있다", () => {
    renderWith();
    expect(screen.getByRole("link", { name: "검색" }).getAttribute("href")).toBe("/search");
    expect(screen.getByRole("link", { name: "알림" }).getAttribute("href")).toBe(
      "/mypage/notifications",
    );
    expect(screen.getByRole("link", { name: "장바구니" }).getAttribute("href")).toBe("/cart");
  });

  // 정렬은 분류와 같이 주소에 남아야 한다. 상품 상세에 갔다 돌아와도 유지돼야 하기 때문이다
  it("주소로 받은 정렬 기준대로 목록을 늘어놓는다", () => {
    renderWith("?sort=rating-low");
    const low = screen.getAllByRole("listitem").map((el) => el.textContent);
    expect(low[0]).toMatch(/적합도 57점/);
  });
});
