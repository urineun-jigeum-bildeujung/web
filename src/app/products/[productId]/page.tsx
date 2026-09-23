// /products/[productId] 라우트. 화면 조립은 views/product-detail에 있다.
//
// 상세는 개인화가 없는 공개 데이터라 서버에서 받는다(AGENTS 5.2). 뷰가 클라이언트
// 컴포넌트인 것은 탭·바텀시트 때문이지 데이터 때문이 아니다.
//
// views/deals처럼 promise를 넘기지 않고 여기서 await한다. 부를 것이 하나뿐이라
// 병렬로 둘 이유가 없고, 없는 상품을 404로 보내는 notFound()는 렌더 중에 호출해야 한다.

import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ApiError } from "@/shared/api/client";
import { getProductDetail } from "@/entities/product";
import { ProductDetailView } from "@/views/product-detail";

export default async function ProductDetailPage({ params }: PageProps<"/products/[productId]">) {
  const { productId } = await params;

  const product = await getProductDetail(productId).catch((error: unknown) => {
    // 없는 상품과 그 밖의 실패는 다르다. 후자는 그대로 던져 오류 경계가 받는다
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });

  if (!product) notFound();

  // nuqs의 useQueryState가 내부에서 useSearchParams를 쓴다.
  // Suspense로 감싸지 않으면 정적 프리렌더가 실패한다.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ProductDetailView productId={productId} product={product} />
    </Suspense>
  );
}
