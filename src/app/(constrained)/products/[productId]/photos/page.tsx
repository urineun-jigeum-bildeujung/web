// /products/[productId]/photos 라우트. 화면 조립은 views/product-photos에 있다.

import { Suspense } from "react";

import { ProductPhotosView } from "@/views/product-photos";

export default async function ProductPhotosPage({
  params,
}: PageProps<"/products/[productId]/photos">) {
  const { productId } = await params;

  // nuqs의 useQueryState가 내부에서 useSearchParams를 쓴다.
  // Suspense로 감싸지 않으면 정적 프리렌더가 실패한다.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ProductPhotosView productId={productId} />
    </Suspense>
  );
}
