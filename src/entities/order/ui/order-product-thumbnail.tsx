// 주문 상품 썸네일 80×80. 이미지가 없으면 회색 칸에 그림 아이콘으로 자리만 잡는다.
// UI 시안 기준(mypa_061 3324:36874, mypa_261 3333:37447)이다.
//
// 상품 줄(`OrderProductRow`)과 반품·교환 신청의 수량 카드가 같은 칸을 쓴다. 옆 글의 모양이
// 서로 달라 줄째로는 못 나누고 썸네일만 나눈다 (#408).

import Image from "next/image";

import { Icon } from "@/shared/ui/icon/icon";

type OrderProductThumbnailProps = {
  /** 없으면 자리만 잡는다. 이미지가 빠진 상품이 있다 */
  imageUrl?: string | null;
};

export function OrderProductThumbnail({ imageUrl }: OrderProductThumbnailProps) {
  return imageUrl ? (
    <Image
      src={imageUrl}
      alt=""
      width={80}
      height={80}
      // 상품명이 옆에 글자로 있으므로 이미지는 장식으로 둔다
      className="size-20 shrink-0 rounded-lg object-cover"
    />
  ) : (
    <span
      aria-hidden
      className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-surface-disable text-icon-fill-secondary"
    >
      <Icon name="image" />
    </span>
  );
}
