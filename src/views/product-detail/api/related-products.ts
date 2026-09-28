// "함께 보면 좋은 상품"을 받아 온다. AI 추천이 붙기 전까지는 인기순이다 (#481).
//
// 몇 개를 받을지는 서버에 맡긴다(`size`). 인기순에 지금 보는 상품이 섞여 올 수 있어 하나 더
// 받고, 섞였으면 뺀다 — 서버에는 "이 상품은 빼고"를 받는 값이 없다.

import { getProducts, type ProductCard } from "@/entities/product";

/** 시안(1716-34241)이 한 줄에 두 장 반을 보인다. 두어 번 밀면 끝나는 수로 자른다 */
export const MAX_RELATED = 6;

export async function getRelatedProducts(productId: number): Promise<ProductCard[]> {
  const { items } = await getProducts({ sort: "POPULAR", size: MAX_RELATED + 1 });
  return items.filter((item) => item.productId !== productId).slice(0, MAX_RELATED);
}
