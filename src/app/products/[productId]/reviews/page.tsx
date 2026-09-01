// /products/[productId]/reviews 라우트. 화면 조립은 views/product-reviews에 있다.

import { ProductReviewsView } from "@/views/product-reviews";

export default async function ProductReviewsPage({
  params,
}: PageProps<"/products/[productId]/reviews">) {
  const { productId } = await params;
  return <ProductReviewsView productId={productId} />;
}
