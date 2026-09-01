// /products/[productId] 라우트. 화면 조립은 views/product-detail에 있다.

import { ProductDetailView } from "@/views/product-detail";

export default async function ProductDetailPage({ params }: PageProps<"/products/[productId]">) {
  const { productId } = await params;
  return <ProductDetailView productId={productId} />;
}
