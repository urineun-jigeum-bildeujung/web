// 주문 상품 한 줄. 썸네일 오른쪽에 이름·옵션이 위로 붙고 결제 금액이 아래로 내려간다.
// UI 시안 기준(mypa_061 287:8530, mypa_061_구매확정 287:8777)이다. 썸네일 96, 사이 8.
//
// `ProductSummary`를 쓰지 않는 이유는 구조다. 그쪽은 이미지와 글이 한 줄로 가운데 맞춰지는데
// 시안은 오른쪽 열이 위아래로 갈린다. prop을 늘려 맞추면 component-convention이 경계하는
// "화면마다 다른 상품 카드를 하나로 묶은" 모양이 된다.

import Image from "next/image";
import type { ReactNode } from "react";
import { IoImageOutline } from "react-icons/io5";

import { formatWon } from "@/shared/ui/price/price";

type OrderProductRowProps = {
  name: string;
  /** 상품명 아래 줄. 고른 옵션 */
  option: string;
  amount: number;
  /** 없으면 자리만 잡는다. 목 데이터 단계와 이미지 실패를 함께 다룬다 */
  imageUrl?: string | null;
  /** 상품명 오른쪽. 목록에서는 주문 상태 뱃지가 붙고 확정 시트에서는 비어 있다 */
  nameTrailing?: ReactNode;
};

export function OrderProductRow({
  name,
  option,
  amount,
  imageUrl,
  nameTrailing,
}: OrderProductRowProps) {
  return (
    <div className="flex items-start gap-2">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          width={96}
          height={96}
          // 상품명이 옆에 글자로 있으므로 이미지는 장식으로 둔다
          className="size-24 shrink-0 rounded-lg object-cover"
        />
      ) : (
        // 디자인 시스템 icon 43종에 이미지 글리프가 없어 react-icons로 채운다 (AGENTS.md 5.3)
        <span
          aria-hidden
          className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary text-icon-fill-secondary"
        >
          <IoImageOutline className="size-6.5" />
        </span>
      )}

      {/* 썸네일이 잡은 96px을 채우고 위아래로 갈라 붙인다 */}
      <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-1">
            <p className="min-w-0 truncate text-title-bold-16 text-foreground">{name}</p>
            {nameTrailing}
          </div>
          <p className="truncate text-body-medium-14 text-text-body-secondary">{option}</p>
        </div>

        <div className="flex items-start justify-between gap-2 text-text-body-secondary">
          <span className="text-body-medium-14">결제 금액</span>
          <span className="text-title-bold-16">{formatWon(amount)}</span>
        </div>
      </div>
    </div>
  );
}
