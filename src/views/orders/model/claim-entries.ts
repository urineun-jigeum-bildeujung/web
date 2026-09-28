// 취소·반품·교환 탭의 건을 만든다. 목록의 취소 주문과 상세의 반품·교환 신청을 한 줄로 세운다.
//
// **신청 건을 모아 주는 API가 없다.** 백엔드가 "상세 조회 응답에 포함되는 정보를 활용"하라고
// 했다(2026-09-23). 그래서 건이 나올 수 있는 주문만 상세를 받아 `items[].claims`를 모은다.
// **취소는 신청 기록을 남기지 않는다** — 주문 상태가 `CANCELLED`가 될 뿐이라 그 주문 하나가 한 건이다 (#462).

import type { OrderDetail, OrderListItem, OrderSummary } from "@/entities/order";
import { toDisplayDayKey } from "@/shared/lib/date/display-date";

export type ClaimEntryKind = "cancel" | "return" | "exchange";

export type ClaimEntry = {
  /** 건마다 다른 키. 취소는 주문 번호, 반품·교환은 신청 번호로 만든다 */
  key: string;
  kind: ClaimEntryKind;
  orderId: number;
  /**
   * 머리와 시각 줄에 쓰는 때(ISO 8601). 반품·교환은 접수일, 취소는 결제일이다 — 취소한 시각은
   * 서버가 남기지 않는다. PD팀이 "상황에 맞게 표시해도 된다"고 했다(2026-09-23)
   */
  date: string;
  /**
   * 그 건에 걸린 상품. 목록의 상품 줄을 그대로 써서 금액이 그 줄에 낸 값이다.
   *
   * **수량은 주문한 수량이다.** 서버가 신청마다 몇 개를 신청했는지 내려 주지 않는다(`ClaimSummary`).
   */
  items: OrderListItem[];
};

export type ClaimDateGroup = {
  /** 묶음마다 다른 키. 첫 건의 키를 붙여 같은 날이 떨어져 와도 겹치지 않는다 */
  key: string;
  /** 머리의 이름. 반품·교환은 "접수일", 취소는 "결제일"이다 */
  label: "접수일" | "결제일";
  /** 머리에 적을 날짜(`26.09.03`). 읽을 수 없으면 `null`이라 머리를 비운다 */
  day: string | null;
  entries: ClaimEntry[];
};

/** 신청이 걸려 있을 수 있는 상태. 반품·교환은 배송완료에서만 받고, 그 뒤로는 확정·환불로만 간다 */
const CLAIMABLE_STATUSES = new Set(["DELIVERED", "CONFIRMED", "PARTIAL_REFUND", "REFUNDED"]);

/** 상세를 받아 봐야 건이 나오는 주문인가. 배송 전 주문은 취소하지 않은 한 건이 없다 */
export function needsClaimDetail(order: OrderSummary): boolean {
  const status = order.orderStatus.toUpperCase();
  return status === "CANCELLED" || CLAIMABLE_STATUSES.has(status);
}

/**
 * 신청 유형을 건의 종류로 옮긴다.
 *
 * `CANCEL` 신청은 우리 화면이 보내지 않는다. 서버는 배송완료 7일 안이면 받기도 하지만, 주문 취소는
 * 배송 전에 `cancelOrder`로 하고 신청 기록을 남기지 않는다(`entities/order`의 `CLAIM_TYPES`).
 * 그래서 취소 건은 신청이 아니라 목록의 취소 주문으로 세운다. 모르는 값은 건으로 세우지 않는다 —
 * 지어낸 뱃지를 다느니 비워 두는 편이 낫다.
 */
function toKind(claimType: string): ClaimEntryKind | null {
  switch (claimType.toUpperCase()) {
    case "RETURN":
      return "return";
    case "EXCHANGE":
      return "exchange";
    default:
      return null;
  }
}

/** 견줄 수 있는 시각. 읽을 수 없는 값은 맨 뒤로 보낸다 */
function toTime(iso: string): number {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? 0 : time;
}

/**
 * 받아 온 상세로 탭의 건을 만든다. 상세가 아직 없는 주문은 건너뛴다.
 *
 * **결제한 적 없는 취소는 세우지 않는다.** 결제 실패·재고 부족으로 서버가 취소한 주문도
 * `CANCELLED`인데, 사용자가 취소한 것이 아니다. 상세에 결제 정보가 있는 것만 취소 건이다.
 *
 * **여러 상품을 한 번에 신청하면 같은 신청이 상품마다 붙어 온다.** 신청 번호로 한 건에 모은다.
 */
export function toClaimEntries(orders: OrderSummary[], details: OrderDetail[]): ClaimEntry[] {
  const entries: ClaimEntry[] = [];

  for (const order of orders) {
    const detail = details.find((candidate) => candidate.orderId === order.orderId);
    if (!detail) {
      continue;
    }

    if (order.orderStatus.toUpperCase() === "CANCELLED") {
      if (detail.payment) {
        entries.push({
          key: `cancel-${order.orderId}`,
          kind: "cancel",
          orderId: order.orderId,
          date: detail.payment.paidAt,
          items: order.items,
        });
      }
      continue;
    }

    for (const item of detail.items) {
      const listItem = order.items.find((candidate) => candidate.orderItemId === item.orderItemId);

      for (const claim of item.claims) {
        const kind = toKind(claim.claimType);
        if (!kind) {
          continue;
        }

        const key = `claim-${claim.claimId}`;
        const existing = entries.find((entry) => entry.key === key);
        if (existing) {
          if (listItem) {
            existing.items.push(listItem);
          }
          continue;
        }
        entries.push({
          key,
          kind,
          orderId: order.orderId,
          date: claim.requestedAt,
          items: listItem ? [listItem] : [],
        });
      }
    }
  }

  // 최근 건이 위로 온다. 주문내역 탭과 같은 순서다
  return entries.sort((a, b) => toTime(b.date) - toTime(a.date));
}

/**
 * 이어서 오는 같은 날·같은 이름의 건을 한 묶음으로 만든다.
 *
 * **이름이 다르면 같은 날이어도 따로 묶는다.** 반품·교환은 접수일, 취소는 결제일이라 한 머리
 * 아래 두면 어느 날짜인지 틀리게 읽힌다.
 */
export function groupClaimEntries(entries: ClaimEntry[]): ClaimDateGroup[] {
  const groups: ClaimDateGroup[] = [];

  for (const entry of entries) {
    const label = entry.kind === "cancel" ? "결제일" : "접수일";
    const day = toDisplayDayKey(entry.date);
    const last = groups.at(-1);

    if (day && last?.day === day && last.label === label) {
      last.entries.push(entry);
      continue;
    }
    groups.push({ key: `${entry.key}-${day ?? "unknown"}`, label, day, entries: [entry] });
  }

  return groups;
}
