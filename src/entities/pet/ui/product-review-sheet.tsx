// 아이가 먹은 제품의 후기를 좋았던 점과 아쉬운 점으로 나눠 보여준다.
// 와이어프레임 기준(mypa_021_상품클릭시)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import Image from "next/image";
import Link from "next/link";
import { IoClose, IoImageOutline } from "react-icons/io5";

import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";

export type PetProductReview = {
  /** 리뷰 상세로 넘어갈 때 쓴다 */
  id: string;
  productName: string;
  imageUrl?: string;
  goodPoints: string[];
  badPoints: string[];
};

type ProductReviewSheetProps = {
  review: PetProductReview | null;
  onOpenChange: (open: boolean) => void;
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

export function ProductReviewSheet({ review, onOpenChange }: ProductReviewSheetProps) {
  return (
    <Drawer open={review !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="p-0">
          {/* 제목은 상품 이름이지만 화면에는 사진이 그 자리를 대신한다. */}
          <DrawerTitle className="sr-only">{review?.productName} 후기</DrawerTitle>
        </DrawerHeader>

        <DrawerClose
          aria-label="닫기"
          className="absolute top-2 right-2 flex size-11 items-center justify-center text-muted-foreground"
        >
          <IoClose aria-hidden className="size-5" />
        </DrawerClose>

        {review && (
          <div className="flex flex-col gap-4 px-4 pb-6">
            <div className="flex justify-center">
              {review.imageUrl ? (
                <Image
                  src={review.imageUrl}
                  alt=""
                  width={96}
                  height={96}
                  // 상품 이름이 시트 제목으로 읽히므로 이미지는 장식으로 둔다.
                  className="size-24 rounded-lg object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex size-24 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                >
                  <IoImageOutline className="size-10" />
                </span>
              )}
            </div>

            <PointList title="이런 점이 좋았어요" points={review.goodPoints} />
            <PointList title="이런 점은 조금 아쉬워요" points={review.badPoints} />

            {/* 고치는 것은 리뷰 상세에서 한다. 이동이므로 버튼이 아니라 링크다. */}
            <Link
              href={`/mypage/reviews/${review.id}`}
              className="flex min-h-11 items-center justify-center text-sm text-muted-foreground underline underline-offset-4"
            >
              수정하기
            </Link>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
