// 결제 상품 줄 링크 테스트. 일반 줄과 타임딜 줄이 어느 상세로 가는지 본다 (QA No.47, #595).
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const { getTimeDealDetail } = vi.hoisted(() => ({ getTimeDealDetail: vi.fn() }));
vi.mock("@/entities/product/api/products", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/product/api/products")>()),
  getTimeDealDetail,
}));

import type { OrderLine } from "../model/order-items";
import { OrderItemLink } from "./order-item-link";

const LINE: OrderLine = {
  itemType: "NORMAL",
  itemId: 252,
  quantity: 1,
  productName: "종근당 캣츠벨",
  thumbnailUrl: null,
  subtotal: 9345,
};

beforeEach(() => {
  vi.clearAllMocks();
  getTimeDealDetail.mockResolvedValue({ productId: 42, name: "딜 상품" });
});

function renderLink(item: OrderLine) {
  return render(<OrderItemLink item={item} />, { wrapper: createQueryWrapper() });
}

test("일반 줄은 줄 번호가 곧 상품 번호다", () => {
  renderLink(LINE);

  expect(screen.getByRole("link", { name: "종근당 캣츠벨" }).getAttribute("href")).toBe(
    "/products/252",
  );
  expect(getTimeDealDetail).not.toHaveBeenCalled();
});

// 딜 아이템 번호만 있어 딜 상세에서 상품 번호를 받는다. 딜가로 보이게 `dealItem`을 붙인다 (#484)
test("타임딜 줄은 상품 번호를 받아 딜가로 보이는 상세로 간다", async () => {
  renderLink({ ...LINE, itemType: "TIME_DEAL", itemId: 7 });

  // 받기 전에는 갈 곳을 모른다. 엉뚱한 상품으로 보내지 않고 글자만 둔다
  expect(screen.queryByRole("link")).toBeNull();
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "종근당 캣츠벨" }).getAttribute("href")).toBe(
      "/products/42?dealItem=7",
    ),
  );
  expect(getTimeDealDetail).toHaveBeenCalledWith("7");
});
