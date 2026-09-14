// 장바구니 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
import { CartView, getCartItems } from "@/views/cart";

export default function CartPage() {
  return <CartView items={getCartItems()} />;
}
