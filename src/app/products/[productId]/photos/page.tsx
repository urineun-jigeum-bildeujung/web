// /products/[productId]/photos 라우트. 화면 조립은 views/product-photos에 있다.

import { Suspense } from "react";

import { PHOTO_REVIEWS } from "@/entities/review";
import { ProductPhotosView } from "@/views/product-photos";

export default async function ProductPhotosPage({
  params,
}: PageProps<"/products/[productId]/photos">) {
  const { productId } = await params;

  // 사진 후기는 연동 전까지 목데이터다. 서버가 내려주면 이 자리에서 조회한다.
  //
  // nuqs의 useQueryState가 내부에서 useSearchParams를 쓴다.
  // Suspense로 감싸지 않으면 정적 프리렌더가 실패한다.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ProductPhotosView productId={productId} reviews={PHOTO_REVIEWS} />
    </Suspense>
  );
}
