// 취소·반품·교환 탭의 한 건. 시각·뱃지·상품 줄·자세히 보기가 차례로 온다.
// UI 시안 기준(mypa_061_취소·반품·교환 3326:33002)이다 (#462).

import Link from "next/link";

import { OrderProductRow } from "@/entities/order";
import { formatDisplayMonthDayTime } from "@/shared/lib/date/display-date";
import { Badge } from "@/shared/ui/badge/badge";
import { Button } from "@/shared/ui/button";

import type { ClaimEntry as ClaimEntryData, ClaimEntryKind } from "../model/claim-entries";
import { summarizeItems } from "../model/item-summary";

/**
 * 뱃지 문구와 색. PD팀이 "취소, 환불, 교환에 맞춰서 뱃지로" 달라고 했다(2026-09-28).
 *
 * **반품 건은 "환불"로 단다.** 시안의 빨간 "환불" 뱃지(`badge/bg/danger_weak`)가 반품 신청 건이다.
 * 색이 시안에 있는 것은 환불뿐이라, 취소·교환은 공용 뱃지의 뜻(회색 기본·파랑 안내)에서 골랐다.
 */
const BADGE = {
  cancel: { label: "취소", tone: "default" },
  return: { label: "환불", tone: "danger" },
  exchange: { label: "교환", tone: "info" },
} as const satisfies Record<ClaimEntryKind, { label: string; tone: string }>;

export function ClaimEntry({ entry }: { entry: ClaimEntryData }) {
  const time = formatDisplayMonthDayTime(entry.date);
  const badge = BADGE[entry.kind];

  return (
    <article className="flex flex-col gap-2">
      {/* 읽을 수 없는 값이면 줄을 비운다. 지어낸 시각을 보이느니 낫다 */}
      {time && <p className="text-body-medium-14 text-text-body-secondary">{time}</p>}
      <Badge tone={badge.tone} className="self-start">
        {badge.label}
      </Badge>

      <ul className="flex flex-col gap-4">
        {entry.items.map((item) => (
          <li key={item.orderItemId}>
            <OrderProductRow
              name={item.productName}
              quantity={item.quantity}
              amount={item.amount}
              imageUrl={item.thumbnailUrl}
            />
          </li>
        ))}
      </ul>

      {/* 시안의 action_button. 40px에 굵은 14px, 연한 회색 바탕이다. 상품 줄과 12px 떨어진다.
          건마다 같은 "자세히 보기"만 있으면 화면 낭독기로 링크만 훑을 때 어느 건인지 가를 수 없어
          뱃지와 상품을 이름 앞에 붙인다. 보이는 글자는 이름 끝에 그대로 둔다(#474) */}
      <Button asChild variant="secondary" className="mt-1 h-10 rounded-lg text-label-bold-14">
        <Link
          href={`/mypage/orders/${entry.orderId}`}
          aria-label={`${badge.label} ${summarizeItems(entry.items)} 자세히 보기`}
        >
          자세히 보기
        </Link>
      </Button>
    </article>
  );
}
