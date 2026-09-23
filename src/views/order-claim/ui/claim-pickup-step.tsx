// ③ 수거. 수거 희망일 둘 중 하나와 안내, 수거 요청사항, 그리고 반품은 환불 안내·교환은 교환 상품 안내.
// UI 시안 기준(mypa_361 3324:38820·38944, mypa_362 3324:38896·39019)이다 (#408).
//
// 교환 안내는 PD 답(2026-09-23)으로 옵션 줄이 빠지고 끝 문구가 "새 상품을 보내드릴게요"가 됐다.

"use client";

import { useId } from "react";

import { TossPayLogo, type ClaimType } from "@/entities/order";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";
import { Input } from "@/shared/ui/input";
import { formatWon } from "@/shared/ui/price/price";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

import type { PickupDate } from "../model/pickup-dates";
import { estimateRefund } from "../model/refund-estimate";
import { PICKUP_REQUEST_MAX } from "../model/to-claim-request";
import { ClaimSection } from "./claim-section";

/** 신청하는 상품 한 줄. 이름·개당 금액·신청 수량 */
export type ClaimLine = {
  orderItemId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
};

/** 안내 박스의 둘째 줄. 수거 뒤에 무엇이 일어나는지가 유형마다 다르다 */
const AFTER_PICKUP: Record<ClaimType, string> = {
  RETURN: "상태 확인이 끝나면 바로 환불해드릴게요.",
  EXCHANGE: "상태 확인이 끝나면 새 상품을 보내드릴게요.",
};

type ClaimPickupStepProps = {
  claimType: ClaimType;
  lines: ClaimLine[];
  dateOptions: PickupDate[];
  pickupDate: string | null;
  onPickupDateChange: (next: string) => void;
  pickupRequest: string;
  onPickupRequestChange: (next: string) => void;
};

/** 이름 · N개. 환불 안내와 교환 상품 안내가 같은 모양이다 */
function LineList({ lines }: { lines: ClaimLine[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {lines.map((line) => (
        <li
          key={line.orderItemId}
          className="flex items-center gap-2 text-body-regular-14 text-foreground"
        >
          <span className="min-w-0 flex-1 truncate">{line.productName}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">{line.quantity}개</span>
        </li>
      ))}
    </ul>
  );
}

/** 이름 …… 값 한 줄. `dl` 안에 `dt`·`dd` 짝으로만 둔다 */
function AmountRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-body-regular-14 text-foreground">
      <dt>{term}</dt>
      <dd className="text-label-bold-14">{value}</dd>
    </div>
  );
}

function RefundGuide({ lines }: { lines: ClaimLine[] }) {
  const estimate = estimateRefund(lines);

  return (
    <ClaimSection title="환불 안내">
      <div className="flex flex-col gap-3 border-b border-border-default pb-4">
        <LineList lines={lines} />
        <dl className="flex flex-col gap-1">
          <AmountRow term="상품 금액" value={formatWon(estimate.productAmount)} />
          <AmountRow term="배송비" value={formatWon(estimate.shippingFee)} />
          <AmountRow term="반품비" value={`-${formatWon(estimate.returnFee)}`} />
        </dl>
      </div>
      <dl className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-title-bold-16">
          <dt className="text-foreground">환불 예상 금액</dt>
          <dd className="text-text-body-brand-strong">{formatWon(estimate.refundAmount)}</dd>
        </div>
        <div className="flex items-center justify-between text-body-regular-14 text-foreground">
          <dt>환불 수단</dt>
          {/* 결제는 토스페이로만 받는다. 결제상세의 결제수단 줄과 같은 로고다 */}
          <dd className="flex items-center gap-1">
            <TossPayLogo />
            <span aria-hidden className="text-label-regular-13 text-text-body-secondary">
              /
            </span>
            <span className="text-label-bold-14">{formatWon(estimate.refundAmount)}</span>
          </dd>
        </div>
      </dl>
    </ClaimSection>
  );
}

function ExchangeGuide({ lines }: { lines: ClaimLine[] }) {
  return (
    <ClaimSection title="교환 상품 안내">
      <div className="border-b border-border-default pb-4">
        <LineList lines={lines} />
      </div>
      <dl>
        <AmountRow term="예상 발송일" value="수거 확인 후 3~5일 이내" />
      </dl>
    </ClaimSection>
  );
}

export function ClaimPickupStep({
  claimType,
  lines,
  dateOptions,
  pickupDate,
  onPickupDateChange,
  pickupRequest,
  onPickupRequestChange,
}: ClaimPickupStepProps) {
  const dateHeadingId = useId();
  const requestHeadingId = useId();

  return (
    <div className="flex flex-col gap-2 px-5 pt-4 pb-6">
      <ClaimSection title="수거 희망일" badge="required" headingId={dateHeadingId}>
        <RadioGroup
          aria-labelledby={dateHeadingId}
          aria-required
          value={pickupDate ?? ""}
          onValueChange={onPickupDateChange}
          className="flex gap-3"
        >
          {dateOptions.map((option) => {
            const id = `${dateHeadingId}-${option.value}`;
            const selected = pickupDate === option.value;

            return (
              <div key={option.value} className="relative min-w-0 flex-1">
                {/* 겉모습은 버튼 칸이지만 둘 중 하나를 고르는 것이라 라디오로 만든다.
                    라디오는 숨기고 레이블을 누르게 한다. shadcn 라디오의 relative·size-4가
                    sr-only를 덮어 16px가 흐름에 남으므로 다시 덮는다 (리뷰 작성 response-select와 같다) */}
                <RadioGroupItem
                  id={id}
                  value={option.value}
                  className="peer sr-only absolute size-px"
                />
                <label
                  htmlFor={id}
                  className={cn(
                    "flex h-10 cursor-pointer items-center justify-center rounded-lg px-2 text-label-bold-14 transition-colors",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "border border-border-default text-text-label-default",
                  )}
                >
                  {option.label}
                </label>
              </div>
            );
          })}
        </RadioGroup>

        <div className="flex items-start gap-1.5 rounded-xl bg-surface-secondary px-2 py-3">
          <Icon name="info" className="size-6 shrink-0 text-icon-fill-secondary" />
          <p className="flex gap-2 text-body-medium-14 text-text-body-secondary">
            <strong className="shrink-0 text-label-bold-14">안내</strong>
            <span>
              1~2일 안에 기사님이 상품을 수거해요.
              <br />
              {AFTER_PICKUP[claimType]}
            </span>
          </p>
        </div>
      </ClaimSection>

      <ClaimSection title="수거 요청사항" badge="optional" headingId={requestHeadingId}>
        <Input
          aria-labelledby={requestHeadingId}
          placeholder="요청사항을 입력해주세요"
          maxLength={PICKUP_REQUEST_MAX}
          value={pickupRequest}
          onChange={(event) => onPickupRequestChange(event.target.value)}
          className="h-13.5 rounded-xl border-border-default px-4 text-body-regular-14 placeholder:text-text-body-secondary"
        />
      </ClaimSection>

      {claimType === "RETURN" ? <RefundGuide lines={lines} /> : <ExchangeGuide lines={lines} />}
    </div>
  );
}
