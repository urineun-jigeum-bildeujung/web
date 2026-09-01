// 아이가 먹은 제품의 후기를 좋았던 점과 아쉬운 점으로 나눠 보여준다.
// 와이어프레임 기준(mypa_021_상품클릭시)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { IoImageOutline } from "react-icons/io5";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";

export type PetProductReview = {
  productName: string;
  imageUrl?: string;
  goodPoints: string[];
  badPoints: string[];
};

type ProductReviewSheetProps = {
  review: PetProductReview | null;
  onOpenChange: (open: boolean) => void;
  /** 후기를 고치러 간다. 없으면 그 줄을 그리지 않는다. */
  onEdit?: () => void;
};

function PointList({ title, points }: { title: string; points: string[] }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <ul className="flex flex-col gap-1">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProductReviewSheet({ review, onOpenChange, onEdit }: ProductReviewSheetProps) {
  return (
    <Drawer open={review !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          {/* 제목은 상품 이름이지만 화면에는 사진이 그 자리를 대신한다 */}
          <DrawerTitle className="sr-only">{review?.productName} 후기</DrawerTitle>
        </DrawerHeader>

        {review && (
          <div className="flex flex-col gap-4 px-4 pb-6">
            <div className="flex justify-center">
              <span
                aria-hidden
                className="flex size-24 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              >
                <IoImageOutline className="size-10" />
              </span>
            </div>

            <PointList title="이런 점이 좋았어요" points={review.goodPoints} />
            <PointList title="이런 점은 조금 아쉬워요" points={review.badPoints} />

            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="min-h-11 text-sm text-muted-foreground underline underline-offset-4"
              >
                수정하기
              </button>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
