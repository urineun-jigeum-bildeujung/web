// 상품 상세 화면.
// IA 기준(상품 상세)이며 시안은 아직 없다.

import { PageHeader } from "@/shared/ui/page-header/page-header";
import Link from "next/link";

interface ProductDetailViewProps {
  productId: string;
}

export function ProductDetailView({ productId }: ProductDetailViewProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="상품 상세" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          상품 상세 정보. 디자인 확정 전 자리 표시 화면입니다.
        </p>
        <p className="text-xs text-muted-foreground">productId: {productId}</p>

        <nav className="flex flex-col gap-2">
          <Link
            href={`/products/${productId}/reviews`}
            className="text-sm text-primary underline underline-offset-4"
          >
            리뷰 보기
          </Link>
        </nav>
      </main>
    </div>
  );
}
