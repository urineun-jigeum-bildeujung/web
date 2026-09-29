// 좋아요의 "최근에 봤어요" 탭. 이 브라우저에서 본 상품을 최신순으로 늘어놓는다 (#509).
//
// 기준은 PRD 마이페이지 기능정의서 ver0.5 "최근 본 상품 조회"다 — 대표 이미지·상품명·판매가·할인율·정가,
// 화면 이동 없는 찜하기, 목록에서 삭제. 확정 시안에는 탭 글자만 있어 배치는 와이어프레임(717:4385)을
// 따른다 — X는 사진 오른쪽 위, 하트는 오른쪽 아래. 모양은 다른 카드의 찜 하트(어두운 원판)와 맞춘다.
//
// 목록은 백엔드 API가 없어 브라우저에 남긴 상품 번호다(`features/recently-viewed`). 카드 값은 상품 상세
// 조회로 받는다. 없어진 상품(404)은 목록에서 조용히 뺀다.

import { useEffect } from "react";

import { useQueryProductDetails, type ProductDetail } from "@/entities/product";
import { useRecentlyViewed } from "@/features/recently-viewed";
import {
  CardHeartButton,
  toWishlistItem,
  useToggleWishlist,
  useWishedProductIds,
} from "@/features/toggle-wishlist";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { Skeleton } from "@/shared/ui/skeleton";

function CardSkeleton() {
  return (
    <div aria-hidden className="flex flex-1 flex-col gap-2">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function RecentTab() {
  const { productIds, ready, remove } = useRecentlyViewed();
  const { entries, error, refetchFailed } = useQueryProductDetails(productIds);
  const { wishedIds, isLoading: isLoadingWishes } = useWishedProductIds();
  const heart = useToggleWishlist();

  // 없어진 상품은 기록에서도 뺀다. 두면 들어올 때마다 404를 다시 부른다
  const goneKey = entries
    .filter((entry) => entry.notFound)
    .map((entry) => entry.productId)
    .join(",");
  useEffect(() => {
    if (goneKey) goneKey.split(",").forEach((productId) => remove(Number(productId)));
  }, [goneKey, remove]);

  const toggleLike = (product: ProductDetail) =>
    heart.toggle(
      product.productId,
      !wishedIds.has(product.productId),
      toWishlistItem({
        productId: product.productId,
        name: product.name,
        thumbnailUrl: product.images[0] ?? null,
        price: product.price,
        originalPrice: product.originalPrice,
      }),
    );

  // 저장된 목록을 읽기 전(서버 렌더·하이드레이션)에는 비었는지 모른다. 빈 상태를 먼저 보이지 않는다
  if (!ready) {
    return (
      <div role="status" aria-live="polite" className="px-5">
        <span className="sr-only">최근 본 상품을 불러오는 중</span>
        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          {Array.from({ length: 4 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  const shown = entries.filter((entry) => !entry.notFound && !entry.isError);

  // 본 상품이 있는데 하나도 받지 못했다. 비어 있다고 말하면 사실과 다르다. 다시 시도를 누르면 조회가
  // 받는 중으로 돌아가 이 칸 대신 뼈대가 보인다
  if (shown.length === 0 && error) {
    return (
      <EmptyState
        role="alert"
        className="flex-1"
        // 찜 탭의 조회 실패와 같게 실패 코드로 문구를 고른다(app-message-convention)
        {...APP_MESSAGE[toAppMessageCode(error)]}
        action={
          <Button variant="outline" size="sm" className="min-h-11 px-3" onClick={refetchFailed}>
            다시 시도
          </Button>
        }
      />
    );
  }

  if (shown.length === 0) {
    return (
      <EmptyState
        className="flex-1"
        icon={<Icon name="clock" />}
        title="최근 본 상품이 없어요"
        description="상품을 둘러보면 여기에 모아 둘게요"
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 px-5">
      {shown.map(({ productId, product }) => (
        <li key={productId} className="flex">
          {product ? (
            <ProductGridCard
              className="flex-1"
              href={`/products/${product.productId}`}
              name={product.name}
              price={product.price}
              originalPrice={product.originalPrice ?? undefined}
              discountRate={product.discountRate}
              imageUrl={product.images[0]}
              // 와이어프레임(717:4385)은 X를 사진 오른쪽 위, 하트를 오른쪽 아래에 둔다. 사진 위 자리 하나를
              // 사진 높이만큼 늘려 위아래로 나눈다. 늘린 자리 자체는 누르지 않게 둬 X와 하트 사이를 눌러도
              // 상세로 간다
              imageActionClassName="pointer-events-none top-1 right-1 bottom-1 flex flex-col justify-between [&>*]:pointer-events-auto"
              imageAction={
                <>
                  <button
                    type="button"
                    onClick={() => remove(product.productId)}
                    aria-label={`${product.name} 최근 본 목록에서 빼기`}
                    className="relative flex size-8 items-center justify-center rounded-full bg-surface-overlay-dimmed text-icon-fill-static-white after:absolute after:-inset-1.5"
                  >
                    <Icon name="cancel" aria-hidden className="size-5" />
                  </button>
                  <CardHeartButton
                    name={product.name}
                    wished={wishedIds.has(product.productId)}
                    loading={isLoadingWishes}
                    onToggle={() => toggleLike(product)}
                  />
                </>
              }
            />
          ) : (
            <CardSkeleton />
          )}
        </li>
      ))}
    </ul>
  );
}
