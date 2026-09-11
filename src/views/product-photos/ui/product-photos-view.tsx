// 사진 리뷰 전체보기. 후기에 달린 사진만 모아 격자로 보인다.
// 와이어프레임 기준(상품 상세_사진 리뷰 모음 화면, _리뷰 탭)이라 디자인 확정 시 바뀔 수 있다.
//
// 사료 후기에서는 사진이 글보다 많은 것을 말한다. 알갱이 크기, 변 상태, 아이가 먹는
// 모습은 글로 옮기기 어렵다. 목록을 훑으며 사진을 찾는 대신 사진만 모아 두면
// 원하는 장면을 먼저 찾고 그 후기로 들어갈 수 있다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { IoImageOutline } from "react-icons/io5";

import { PHOTO_REVIEWS, PHOTO_TOTAL } from "@/entities/review";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { PageHeader } from "@/shared/ui/page-header/page-header";

import { PhotoViewer } from "./photo-viewer";

/** 격자에 놓을 사진 한 장. 어느 후기의 몇 번째인지를 함께 든다 */
type PhotoRef = {
  reviewIndex: number;
  photoIndex: number;
};

const PHOTOS: PhotoRef[] = PHOTO_REVIEWS.flatMap((review, reviewIndex) =>
  Array.from({ length: review.photoCount }, (_, photoIndex) => ({ reviewIndex, photoIndex })),
);

type ProductPhotosViewProps = {
  productId: string;
};

export function ProductPhotosView({ productId }: ProductPhotosViewProps) {
  const router = useRouter();

  // 사진 한 장을 가리킬 주소가 있어야 공유되고, 뒤로가기로 격자에 돌아온다.
  // 화면 안 상태로 들면 닫는 순간 어디를 보고 있었는지 사라진다
  const [review, setReview] = useQueryState("review", parseAsInteger);
  const [photo, setPhoto] = useQueryState("photo", parseAsInteger.withDefault(0));

  const opened = review !== null && review >= 0 && review < PHOTO_REVIEWS.length;

  // 사진을 여는 것은 화면 구성이 통째로 바뀌는 전환이다. nuqs 기본인 replace로 두면
  // 격자 주소가 히스토리에 남지 않아, 뒤로가기가 격자를 건너뛰고 상품 상세로 나간다
  const open = (ref: PhotoRef) => {
    void setReview(ref.reviewIndex, { history: "push" });
    void setPhoto(ref.photoIndex, { history: "push" });
  };

  // 닫기는 되돌아가는 것이라 새 기록을 만들지 않는다
  const close = () => {
    void setReview(null, { history: "replace" });
    void setPhoto(null, { history: "replace" });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="사진 리뷰 전체보기" />

      <main className="flex flex-1 flex-col">
        {PHOTOS.length > 0 ? (
          <>
            <p className="px-4 py-3 text-sm text-muted-foreground">
              사진이 있는 리뷰 <span className="font-bold text-foreground">{PHOTO_TOTAL}장</span>
            </p>

            {/* 시안은 여백 없는 3열이다. 사진을 최대한 크게 보여주려는 것이다 */}
            <ul className="grid grid-cols-3 gap-0.5">
              {PHOTOS.map((ref) => {
                const owner = PHOTO_REVIEWS[ref.reviewIndex];
                return (
                  <li key={`${ref.reviewIndex}-${ref.photoIndex}`}>
                    <button
                      type="button"
                      aria-label={`${owner.nickname}의 후기 사진 ${ref.photoIndex + 1}번째 크게 보기`}
                      onClick={() => open(ref)}
                      className="flex aspect-square w-full items-center justify-center bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <IoImageOutline aria-hidden className="size-7 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <EmptyState
            title="아직 사진 후기가 없어요"
            description="사진과 함께 남긴 후기가 이곳에 모여요."
            className="py-16"
          />
        )}
      </main>

      {opened && (
        <PhotoViewer
          review={PHOTO_REVIEWS[review]}
          photoIndex={photo}
          onPhotoChange={(next) => void setPhoto(next)}
          onClose={close}
          onBuy={() => router.push(`/products/${productId}`)}
        />
      )}
    </div>
  );
}
