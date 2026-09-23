// 주문 상품 한 줄. 썸네일 오른쪽에 이름·수량·금액이 세 줄로 붙는다.
// UI 시안 기준(mypa_061 3324:36874, mypa_161 3324:36699, mypa_061_구매확정_시트 3324:37128)이다.
// 썸네일 80, 사이 12 (#405).
//
// 목록·상세·구매확정 시트·반품 신청이 같은 줄을 쓴다. `views` 안에 두면 서로 참조하게 되어
// ESLint가 막으므로 여기 있다.
//
// `ProductSummary`를 쓰지 않는 이유는 구조다. 그쪽은 이미지와 글이 한 줄로 가운데 맞춰지는데
// 시안은 오른쪽 열이 세 줄로 갈린다. prop을 늘려 맞추면 component-convention이 경계하는
// "화면마다 다른 상품 카드를 하나로 묶은" 모양이 된다.

import { OrderProductThumbnail } from "./order-product-thumbnail";

type OrderProductRowProps = {
  name: string;
  /** 산 개수. 시안의 둘째 줄이다 */
  quantity: number;
  /**
   * 그 줄에 낸 돈.
   *
   * **없을 수 있다.** 주문 목록 응답(`GET /orders`)에는 상품별 금액이 없다. `0원`으로 그리면
   * 공짜로 산 것처럼 보이므로 줄째 비운다 (#405)
   */
  amount?: number;
  /** 없으면 자리만 잡는다. 이미지가 빠진 상품이 있다 */
  imageUrl?: string | null;
};

export function OrderProductRow({ name, quantity, amount, imageUrl }: OrderProductRowProps) {
  return (
    <div className="flex items-center gap-3">
      <OrderProductThumbnail imageUrl={imageUrl} />

      {/* 시안은 세 줄을 80px 안에 위아래로 벌린다. 금액이 빠진 목록에서도 두 줄이 한가운데
          모이도록 벌리지 않고 가운데로 모은다 */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="truncate text-title-bold-16 text-foreground">{name}</p>
        <p className="text-body-medium-14 text-text-body-secondary">{quantity}개</p>
        {amount !== undefined && (
          // 시안이 숫자와 단위의 굵기를 달리한다. 장바구니(cart_001)와 같다
          <p className="text-foreground">
            <span className="text-title-bold-16">{amount.toLocaleString("ko-KR")}</span>
            <span className="text-body-medium-16">원</span>
          </p>
        )}
      </div>
    </div>
  );
}
