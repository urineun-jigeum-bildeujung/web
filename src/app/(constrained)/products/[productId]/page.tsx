// /products/[productId] 라우트. 화면 조립은 views/product-detail에 있다.
//
// 상세는 개인화가 없는 공개 데이터라 서버에서 받는다(AGENTS 5.2). 뷰가 클라이언트
// 컴포넌트인 것은 탭·바텀시트 때문이지 데이터 때문이 아니다.
//
// 상품은 여기서 await한다. 없는 상품을 404로 보내는 notFound()는 렌더 중에 호출해야 한다.
// "함께 보면 좋은 상품"은 기다리지 않고 promise로 넘긴다 — 그 칸만 기다리게 해 상품이 늦게
// 뜨지 않는다(views/deals와 같은 방식, #481).
//
// 타임딜에서 들어오면 주소에 딜 아이템 번호(`dealItem`)가 붙는다. 딜가는 일반 상품 상세에 오지
// 않아 그 번호로 타임딜 상세를 받는다(`getDetailProduct`, #484).

import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getDetailProduct, getRelatedProducts, ProductDetailView } from "@/views/product-detail";

function toSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: PageProps<"/products/[productId]">) {
  const [{ productId }, query] = await Promise.all([params, searchParams]);

  const product = await getDetailProduct(productId, toSearchParam(query.dealItem));

  if (!product) notFound();

  // **없는 상품이면 부르지 않는다** — 404로 끝나면 이 promise를 아무도 읽지 않아, 실패했을 때
  // 처리되지 않은 거부로 남는다
  const relatedPromise = getRelatedProducts(product.productId);

  // nuqs의 useQueryState가 내부에서 useSearchParams를 쓴다.
  // Suspense로 감싸지 않으면 정적 프리렌더가 실패한다.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ProductDetailView productId={productId} product={product} relatedPromise={relatedPromise} />
    </Suspense>
  );
}
