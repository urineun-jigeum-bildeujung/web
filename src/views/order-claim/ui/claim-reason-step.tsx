// ② 사유. 고른 상품의 수량, 사유 보기 다섯과 사진 첨부, 상세 사유.
// UI 시안 기준(mypa_261 반품 신청 3333:37513·37439, mypa_262 교환신청 3333:37587·37668)이다 (#408).
//
// 첫 카드 제목은 교환이 "교환할 상품", 반품이 "반품할 상품"이다. 시안의 반품 쪽은 "상품을
// 선택해주세요"였는데, 앞 단계에서 이미 골라 넘어오는 흐름이라 교환과 맞췄다 — PD 승인(2026-09-23).

"use client";

import { useId } from "react";

import { OrderProductThumbnail, type OrderDetailItem } from "@/entities/order";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge/badge";
import { formatWon } from "@/shared/ui/price/price";
import { QuantityStepper } from "@/shared/ui/quantity-stepper/quantity-stepper";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Textarea } from "@/shared/ui/textarea";

import {
  CLAIM_REASON_LABEL,
  CLAIM_REASONS,
  isClaimReason,
  type ClaimReason,
} from "../model/claim-reasons";
import type { ClaimSelection } from "../model/claim-selection";
import { DETAIL_MAX } from "../model/to-claim-request";
import { ClaimPhotoPicker } from "./claim-photo-picker";
import { ClaimSection } from "./claim-section";

type ClaimReasonStepProps = {
  /** "반품" 또는 "교환". 제목과 수량 이름에 들어간다 */
  label: string;
  /** 앞 단계에서 고른 상품 */
  items: OrderDetailItem[];
  selection: ClaimSelection;
  onQuantityChange: (orderItemId: number, next: number) => void;
  reason: ClaimReason | null;
  onReasonChange: (next: ClaimReason) => void;
  photos: File[];
  onPhotosChange: (next: File[]) => void;
  detail: string;
  onDetailChange: (next: string) => void;
};

export function ClaimReasonStep({
  label,
  items,
  selection,
  onQuantityChange,
  reason,
  onReasonChange,
  photos,
  onPhotosChange,
  detail,
  onDetailChange,
}: ClaimReasonStepProps) {
  const reasonHeadingId = useId();
  const detailHeadingId = useId();

  return (
    <div className="flex flex-col gap-2 px-5 pt-4 pb-6">
      {/* 시안이 이 카드만 모서리 12다 */}
      <ClaimSection title={`${label}할 상품`} badge="required" className="rounded-xl">
        <ul className="flex flex-col gap-2 pb-3">
          {items.map((item) => (
            <li key={item.orderItemId} className="flex flex-col gap-2">
              <div className="flex items-center gap-3 py-2">
                <OrderProductThumbnail imageUrl={item.thumbnailUrl} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="line-clamp-2 text-label-bold-14 text-foreground">
                    {item.productName}
                  </p>
                  <p className="text-body-medium-14 text-foreground">
                    개당 {formatWon(item.unitPrice)} · 구매 {item.quantity}개
                  </p>
                </div>
              </div>
              <div className="flex h-8 items-center justify-between pl-1">
                <span className="text-body-medium-14 text-text-body-secondary">{label} 수량</span>
                <QuantityStepper
                  label={`${item.productName} ${label} 수량`}
                  value={selection[item.orderItemId] ?? 1}
                  onChange={(next) => onQuantityChange(item.orderItemId, next)}
                  // **남은 수량이 상한이다.** 주문 수량으로 잡으면 이미 취소·반품한 몫까지
                  // 고를 수 있어 서버가 거절한다 (#374)
                  max={item.effectiveQuantity}
                />
              </div>
            </li>
          ))}
        </ul>
      </ClaimSection>

      {/* 사진 첨부가 같은 카드 안 아래에 붙고 그쪽이 아래 여백을 갖는다 */}
      <ClaimSection
        title={`${label} 사유를 선택해주세요`}
        badge="required"
        headingId={reasonHeadingId}
        className="pb-0"
      >
        <RadioGroup
          aria-labelledby={reasonHeadingId}
          aria-required
          value={reason ?? ""}
          onValueChange={(value) => {
            if (isClaimReason(value)) {
              onReasonChange(value);
            }
          }}
          className="gap-0"
        >
          {CLAIM_REASONS.map((value, index) => {
            const id = `${reasonHeadingId}-${value}`;
            const last = index === CLAIM_REASONS.length - 1;

            return (
              <div
                key={value}
                className={cn(
                  "flex items-center gap-2",
                  last ? "pt-3 pb-4" : "border-b border-border-default py-3",
                )}
              >
                {/* 시안의 라디오는 24px 브랜드색이다. 공용 라디오(16px 기본색)를 여기서만 키운다 */}
                <RadioGroupItem
                  id={id}
                  value={value}
                  className="size-6 border-border-default data-checked:border-surface-brand data-checked:bg-surface-brand"
                />
                <label
                  htmlFor={id}
                  className="flex-1 cursor-pointer text-body-medium-16 text-foreground"
                >
                  {CLAIM_REASON_LABEL[value]}
                </label>
              </div>
            );
          })}
        </RadioGroup>

        <div className="flex flex-col gap-3 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-title-bold-16 text-foreground">사진 첨부</h3>
            <Badge>선택</Badge>
          </div>
          <ClaimPhotoPicker photos={photos} onChange={onPhotosChange} />
        </div>
      </ClaimSection>

      <ClaimSection title="상세 사유" badge="optional" headingId={detailHeadingId}>
        <div className="flex flex-col gap-1">
          <Textarea
            aria-labelledby={detailHeadingId}
            placeholder="상세 사유를 입력해주세요"
            maxLength={DETAIL_MAX}
            value={detail}
            onChange={(event) => onDetailChange(event.target.value)}
            className="min-h-27.5 rounded-xl border-border-default p-4 text-body-regular-14 placeholder:text-text-body-secondary"
          />
          <p className="text-right text-label-medium-12 text-text-body-secondary">
            {detail.length}/{DETAIL_MAX}
          </p>
        </div>
      </ClaimSection>
    </div>
  );
}
