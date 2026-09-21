// 타임딜 목록 조회 API. 일반 async 함수라 서버·클라이언트 어디서나 쓴다.
//
// 규격 출처는 실행 중인 백엔드(product-service) 서비스 코드로 직접 확인했다(2026-09-21, #282).
// `TimeDealListService.getTimeDeals`가 dealId로 묶을 뿐 개수를 하나로 제한하지 않으므로,
// 한 상태(status)에 딜 묶음이 여러 개 올 수 있다 — 화면은 배열을 그대로 순회해야 한다.

import { apiRequest } from "@/shared/api/client";

export type TimeDealStatus = "ACTIVE" | "SCHEDULED";

/** 백엔드 `StockBadge`. NONE은 "배지 없음(재고 충분)"이라는 뜻이라 화면의 stock:"none"(품절)과 반대다 */
type ApiStockBadge = "NONE" | "LOW_STOCK" | "SOLD_OUT";

/** 백엔드 `ItemResponse` 그대로. 화면은 이 타입을 직접 쓰지 않는다 */
type ItemResponse = {
  productId: number;
  timeDealItemId: number;
  thumbnailUrl: string | null;
  productName: string;
  normalPrice: number;
  discountedPrice: number;
  discountRate: number;
  unitPrice: number;
  // 정규화 단위가 없는 상품은 서비스 코드에서 그대로 null을 내려보낸다(PriceCalculator.unitPrice와
  // 달리 fallback이 없음) — 실제로 nullable이라 화면에서 있음/없음을 갈라 그려야 한다
  unitLabel: string | null;
  stockBadge: ApiStockBadge;
};

/** 백엔드 `DealGroupResponse` 그대로 */
type DealGroupResponse = {
  dealId: number;
  dealName: string;
  startAt: string;
  endAt: string;
  items: ItemResponse[];
};

/** 백엔드 `TimeDealListResponse` 그대로 */
type TimeDealListApiResponse = {
  deals: DealGroupResponse[];
  serverTime: string;
};

/** 화면의 재고 배지. 백엔드 NONE(배지 없음=충분)과 이름이 반대로 겹치지 않게 새로 짓는다 */
export type DealStock = "enough" | "low" | "none";

/** 딜 묶음 안의 상품 한 줄 */
export type DealItem = {
  /** 이 딜 자체의 id(`time_deal_items`의 deal_item_id) — 담기·행 식별에 쓴다 */
  timeDealItemId: number;
  /** 상품 상세로 이동할 때 쓰는 실제 상품 id. 딜 id와 다른 자원이다 */
  productId: number;
  name: string;
  thumbnailUrl: string | null;
  price: number;
  originalPrice: number;
  /** 서버가 이미 계산해 주는 값. 화면에서 다시 계산하지 않는다 */
  discountRate: number;
  unitLabel: string | null;
  unitAmount: number;
  stock: DealStock;
};

/**
 * 딜 묶음 하나. `startAt`·`endAt`은 문자열로 유지한다 — 화면 모델에 Date 객체를 넣으면
 * (직렬화·재조회 등에서) 문제가 생기기 쉬워, 렌더링 경계(Countdown에 넘기는 지점)에서만
 * `new Date(...)`로 바꾼다.
 */
export type TimeDealGroup = {
  dealId: number;
  dealName: string;
  startAt: string;
  endAt: string;
  items: DealItem[];
};

export type TimeDealList = {
  groups: TimeDealGroup[];
  serverTime: string;
};

function toStock(badge: ApiStockBadge): DealStock {
  if (badge === "SOLD_OUT") return "none";
  if (badge === "LOW_STOCK") return "low";
  return "enough";
}

function toItem(item: ItemResponse): DealItem {
  return {
    timeDealItemId: item.timeDealItemId,
    productId: item.productId,
    name: item.productName,
    thumbnailUrl: item.thumbnailUrl,
    price: item.discountedPrice,
    originalPrice: item.normalPrice,
    discountRate: item.discountRate,
    unitLabel: item.unitLabel,
    unitAmount: item.unitPrice,
    stock: toStock(item.stockBadge),
  };
}

function toGroup(group: DealGroupResponse): TimeDealGroup {
  return {
    dealId: group.dealId,
    dealName: group.dealName,
    startAt: group.startAt,
    endAt: group.endAt,
    items: group.items.map(toItem),
  };
}

/** 공개 엔드포인트라 토큰을 붙이지 않는다 */
export function getTimeDeals(status: TimeDealStatus): Promise<TimeDealList> {
  return apiRequest<TimeDealListApiResponse>("/time-deals", {
    auth: false,
    query: { status },
  }).then((response) => ({
    groups: response.deals.map(toGroup),
    serverTime: response.serverTime,
  }));
}
