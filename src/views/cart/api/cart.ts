// 장바구니 데이터를 가져오는 자리. 백엔드가 아직 없어 목을 돌려준다.
//
// 화면이 이 함수만 보게 해 두면, API가 생겼을 때 이 안이 `apiRequest` 호출로 바뀌고
// 화면 코드는 그대로 둘 수 있다. 지금처럼 목을 컴포넌트 안에 두면 그때 화면까지 함께 고쳐야 한다.
//
// 백엔드 상태(2026-09-14) — `order-service`·`payment-service`는 폴더만 있고 컨트롤러가 없다.
// 장바구니는 서비스 자체가 아직 없다. 그래서 응답 타입도 확정이 아니라 **시안이 쓰는 필드**로 잡았다.
//
// TanStack Query 훅은 아직 붙이지 않는다. 응답 규격과 에러 코드가 정해지지 않아
// 지금 만든 로딩·에러 처리가 그대로 쓰일지 알 수 없다. 키는 `QUERY_KEYS.cart`에 이미 있다.

/** 장바구니에 담긴 상품 한 줄 */
export type CartItem = {
  id: string;
  productId: string;
  name: string;
  /** 서버가 아직 이미지를 주지 않아 비어 있을 수 있다 */
  imageUrl: string | null;
  price: number;
  quantity: number;
};

/** API 연동 전까지 화면 확인용. 문구와 금액은 시안(cart_001)을 그대로 옮겼다 */
const MOCK_ITEMS: CartItem[] = [
  {
    id: "1",
    productId: "p1",
    name: "종근당 캐롯웰 강아지 고양이 장 건강 유산균 영양제 가루날림없는 동결건조 프로바이오틱스 50g",
    imageUrl: null,
    price: 19900,
    quantity: 1,
  },
  {
    id: "2",
    productId: "p2",
    name: "도그퓨어 명작 수제간식 한우 우피껌 80g 강아지간식",
    imageUrl: null,
    price: 8000,
    quantity: 1,
  },
  {
    id: "3",
    productId: "p3",
    name: "잇츄 츄잇 한우스틱 오래먹는 수제 간식 개껌 한우 불리스틱",
    imageUrl: null,
    price: 3900,
    quantity: 1,
  },
];

/**
 * 장바구니 목록을 가져온다.
 *
 * API가 생기면 이 안이 `apiRequest<CartItem[]>("/carts")`가 된다.
 * 호출부는 바뀌지 않는다.
 */
export function getCartItems(): CartItem[] {
  return MOCK_ITEMS;
}
