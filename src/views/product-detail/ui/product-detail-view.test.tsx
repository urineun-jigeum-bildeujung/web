// 적합도가 아이에 따라 갈리는지, 재지 못한 아이를 0점으로 읽히지 않게 하는지 본다.
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

// 헤더 종은 서버 상태를 읽는 위젯이다. 이 화면 테스트에는 QueryClient가 없어 링크만 대신 그린다(#395)
vi.mock("@/widgets/notification-bell", () => ({
  NotificationBell: ({ className }: { className?: string }) => (
    <a href="/mypage/notifications" aria-label="알림" className={className} />
  ),
  NewNotificationToaster: () => null,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

const { add } = vi.hoisted(() => ({ add: vi.fn() }));
// 담기는 서버를 부른다. 이 화면 테스트의 관심은 담은 뒤의 표시라 호출만 세운다 (#316)
vi.mock("@/entities/cart", () => ({ useMutateCartItem: () => ({ add, isAdding: false }) }));
vi.mock("sonner", () => ({
  toast: { custom: vi.fn(), dismiss: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

import type { ProductDetail } from "@/entities/product";

import { ProductDetailView } from "./product-detail-view";

// 라우트가 서버에서 받아 넘기는 값이다. 상태(정상·품절)는 soldOut이 가른다
const PRODUCT: ProductDetail = {
  productId: 1,
  timeDealItemId: null,
  images: [],
  name: "면역 지원 영양제 90정",
  price: 21_000,
  originalPrice: 30_000,
  discountRate: 30,
  rating: 4.8,
  reviewCount: 108,
  soldOut: true,
  detail: {
    manufacturer: "대한펫푸드",
    brandName: "포포도그",
    originCountry: "대한민국",
    netQuantityValue: 90,
    netQuantityUnit: "정",
    ingredients: ["타우린", "글루코사민"],
    feedingTarget: "8세 이상",
    targetBreedSize: "소형·중형견",
    targetAgeGroup: "SENIOR",
    targetSpecies: ["DOG"],
    feedingMethod: "1일 1정, 사료와 함께 급여",
    allergens: [{ code: "EGG", displayName: "계란", severity: "CRITICAL" }],
    cautions: ["HIGH_SODIUM"],
    consumptionPeriodDisplay: "제조일로부터 18개월",
    shelfLifeAfterOpeningDays: 60,
    storageMethod: "직사광선을 피해 서늘하고 건조한 곳에 보관",
  },
};

function renderWith(search = "", product: Partial<ProductDetail> = {}) {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <ProductDetailView productId="1" product={{ ...PRODUCT, ...product }} />
    </NuqsTestingAdapter>,
  );
}

describe("ProductDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("가격 아래에 적합도와 근거가 함께 있다", () => {
    renderWith();

    expect(screen.getByRole("heading", { name: "소리와 잘 맞아요" })).toBeDefined();
    expect(screen.getByText("관절 건강에 도움되는 글루코사민이 들어있어요")).toBeDefined();
  });

  // 좋은 말만 있으면 광고와 구별되지 않는다. 지켜볼 것이 같은 자리에 있어야 근거로 읽힌다
  it("지켜볼 점도 같은 자리에 있다", () => {
    renderWith();

    expect(screen.getByText("나트륨 함량이 또래 평균보다 다소 높은 편이에요")).toBeDefined();
  });

  it("탭을 옮기면 그 탭 내용이 나온다", () => {
    renderWith("?tab=qna");

    // Q&A 탭은 문의 목록을 담는다(#153). 예전의 빈 문구와 문의하기 버튼은 없어졌다
    expect(screen.getByRole("link", { name: "상품 문의" })).toBeDefined();
    expect(screen.getByText("하루에 몇 알씩 급여하면 되나요?")).toBeDefined();
    expect(screen.queryByRole("heading", { name: "영양 성분 분석" })).toBeNull();
  });

  it("상품 정보 탭에 영양 성분 분석이 있다", () => {
    renderWith();

    expect(screen.getByRole("heading", { name: "영양 성분 분석" })).toBeDefined();
    expect(screen.getByText("종합 92점")).toBeDefined();
    expect(screen.getByText("소리에게 꾸준히 급여하기 좋은 상품이에요")).toBeDefined();
  });

  it("비교하기를 누르면 한 상품을 담은 안내를 띄우고 확인 시 비교 화면으로 이동한다", () => {
    renderWith();

    fireEvent.click(screen.getByRole("button", { name: "비교하기" }));
    expect(toast.custom).toHaveBeenCalledOnce();

    const renderToast = vi.mocked(toast.custom).mock.calls[0][0];
    render(renderToast("compare-toast"));
    expect(screen.getByRole("status").textContent).toContain("상품이 비교하기에 담겼어요");

    fireEvent.click(screen.getByRole("button", { name: "확인하기" }));
    expect(push).toHaveBeenCalledWith("/compare?slot=0&product=1&from=detail");
  });

  describe("평소 상태(정상 재고)", () => {
    it("장바구니 버튼을 누르면 수량을 고르는 시트가 열린다", () => {
      renderWith("", { soldOut: false });

      fireEvent.click(screen.getByRole("button", { name: /^장바구니$/ }));

      const sheet = screen.getByRole("dialog", { name: "면역 지원 영양제 90정 수량 고르기" });

      // 고를 옵션은 없다(#137). 남는 것은 지금 담는 것이 무엇인지 알리는 용량뿐이다
      // (같은 "90정"이 상세 설명 표의 제품 용량에도 있어 시트 안으로 좁혀 본다)
      expect(within(sheet).getByText("90정")).toBeDefined();
    });

    it("옵션 시트에서 담으면 시트가 닫히고 담김 안내가 뜬다", async () => {
      renderWith("", { soldOut: false });

      fireEvent.click(screen.getByRole("button", { name: /^장바구니$/ }));
      fireEvent.click(screen.getByRole("button", { name: "21,000원 장바구니 담기" }));

      // 담기가 서버를 기다린다. 응답이 온 뒤에 시트가 닫힌다 (#316)
      await waitFor(() =>
        expect(
          screen.queryByRole("dialog", { name: "면역 지원 영양제 90정 수량 고르기" }),
        ).toBeNull(),
      );
      expect(add).toHaveBeenCalledWith({ itemType: "NORMAL", itemId: 1 }, 1);
      expect(toast.custom).toHaveBeenCalledOnce();

      const renderToast = vi.mocked(toast.custom).mock.calls[0][0];
      render(renderToast("cart-toast"));
      expect(screen.getByRole("status").textContent).toContain("상품이 장바구니에 담겼어요");
    });

    // 딜 아이템으로 담아야 딜가가 붙는다. 그냥 상품으로 담으면 정가로 들어간다
    it("타임딜 상품은 딜 아이템 id로 담는다", async () => {
      renderWith("", { soldOut: false, timeDealItemId: 77 });

      fireEvent.click(screen.getByRole("button", { name: /^장바구니$/ }));
      fireEvent.click(screen.getByRole("button", { name: "21,000원 장바구니 담기" }));

      await waitFor(() =>
        expect(add).toHaveBeenCalledWith({ itemType: "TIME_DEAL", itemId: 77 }, 1),
      );
    });
  });

  // 종료 시각이 상세 응답에 없어 타임딜 화면은 아직 개발용 오버라이드로만 본다(#413)
  it("타임딜 중에는 카운트다운이 붙은 구매 버튼 하나만 있다", () => {
    renderWith("?status=deal", { soldOut: false });

    expect(screen.getByText("타임딜")).toBeDefined();
    expect(screen.getByRole("link", { name: /타임딜 구매하기/ })).toBeDefined();
    expect(screen.queryByRole("button", { name: /^장바구니$/ })).toBeNull();
  });

  it("품절이면 재입고 알림 버튼만 있고 누르면 안내가 뜬다", () => {
    renderWith();

    expect(screen.getByText("품절")).toBeDefined();
    expect(screen.queryByRole("button", { name: /^장바구니$/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "재입고 알림 신청" }));
    expect(toast.custom).toHaveBeenCalledOnce();

    const renderToast = vi.mocked(toast.custom).mock.calls[0][0];
    render(renderToast("restock-toast"));
    expect(screen.getByRole("status").textContent).toContain("재입고되면 바로 알려드릴게요!");
  });

  it("찜을 누르면 채워진 하트로 바뀌고 담김 안내가 뜬다", () => {
    renderWith();

    fireEvent.click(screen.getByRole("button", { name: "찜 목록에 담기" }));

    expect(screen.getByRole("button", { name: "찜 목록에서 빼기" })).toBeDefined();
    expect(toast.custom).toHaveBeenCalledOnce();

    const renderToast = vi.mocked(toast.custom).mock.calls[0][0];
    render(renderToast("liked-toast"));
    expect(screen.getByRole("status").textContent).toContain("해당 상품을 찜 목록에 담았어요!");
  });
});
