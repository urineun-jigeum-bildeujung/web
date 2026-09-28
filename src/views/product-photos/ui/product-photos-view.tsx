// 사진 리뷰 전체보기. 후기에 달린 사진만 모아 격자로 보인다.
// 와이어프레임 기준(상품 상세_사진 리뷰 모음 화면, _리뷰 탭)이라 디자인 확정 시 바뀔 수 있다.
//
// 사료 후기에서는 사진이 글보다 많은 것을 말한다. 알갱이 크기, 변 상태, 아이가 먹는
// 모습은 글로 옮기기 어렵다. 목록을 훑으며 사진을 찾는 대신 사진만 모아 두면
// 원하는 장면을 먼저 찾고 그 후기로 들어갈 수 있다.
//
// **주소는 후기 번호로 가리킨다.** 전에는 배열 순번이었는데, 쪽을 이어 받으면 같은 번호가
// 다른 사진을 가리키게 된다. `reviewId`는 쪽과 무관하게 같은 후기를 가리켜, 격자를 몇 쪽까지
// 받았든 공유된 주소가 그대로 열린다.

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

import { useQueryReviewPhotos, type ReviewPhoto } from "@/entities/review";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { useLoadMore } from "@/shared/lib/list/use-load-more";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Skeleton } from "@/shared/ui/skeleton";

import { PhotoViewer } from "./photo-viewer";

type ProductPhotosViewProps = {
  productId: string;
};

/**
 * 격자에서 고른 사진이 그 후기의 몇 번째인지 센다.
 *
 * 뷰어는 후기 단위로 사진을 넘기므로(점 개수가 그 후기 사진 수다) 전체 순번이 아니라
 * 후기 안 순번이 필요하다.
 *
 * **현재 백엔드 구현은 같은 후기의 사진을 격자에서도 상세에서도 `sortOrder` 오름차순으로
 * 준다.** 격자 쿼리가 `order by createdAt desc, sortOrder asc`이고 상세는
 * `orderBySortOrderAsc`라, 앞에 몇 번 나왔는지를 세면 상세 응답의 자리와 맞는다. 격자는
 * 0쪽부터 순서대로 받으므로 앞쪽 사진이 빠질 일도 없다.
 *
 * **정식 계약으로 약속된 순서는 아니다.** 사진마다 안정적인 식별자(`photoId` 또는
 * `imageIndex`)를 백엔드에 요청해 둔 상태이고, 오면 이 계산이 사라진다.
 */
function indexWithinReview(photos: ReviewPhoto[], at: number) {
  const { reviewId } = photos[at];
  return photos.slice(0, at).filter((photo) => photo.reviewId === reviewId).length;
}

/** 처음 그릴 때 격자 자리를 잡는다 */
function PhotoGridSkeleton() {
  return (
    <ul className="grid grid-cols-3 gap-1 px-5">
      {Array.from({ length: 9 }, (_, key) => (
        <li key={key}>
          <Skeleton className="aspect-square w-full rounded-none" />
        </li>
      ))}
    </ul>
  );
}

export function ProductPhotosView({ productId }: ProductPhotosViewProps) {
  const router = useRouter();
  const { photos, totalCount, error, isLoading, hasNext, loadNext, isLoadingNext, nextError } =
    useQueryReviewPhotos(productId);

  // 사진 한 장을 가리킬 주소가 있어야 공유되고, 뒤로가기로 격자에 돌아온다.
  // 화면 안 상태로 들면 닫는 순간 어디를 보고 있었는지 사라진다.
  //
  // **두 값을 한 번에 갱신한다.** 따로 부르면 히스토리가 두 칸 쌓여, 뒤로가기를 두 번 눌러야
  // 격자로 돌아온다
  const [{ photo: openedReviewId, n: photoIndex }, setViewer] = useQueryStates({
    photo: parseAsString,
    n: parseAsInteger.withDefault(0),
  });

  const list = photos ?? [];

  // 목록 끝이 보이면 다음 쪽을 가져온다. 가져오는 중이거나 방금 실패했으면 멈춘다
  const loadMoreRef = useLoadMore(loadNext, hasNext && !isLoadingNext && !nextError);

  // 이 화면에서 연 뷰어인지. 닫는 방법이 갈린다 — 아래 close 참고.
  // 화면에 그려지지 않는 값이라 상태가 아니라 ref다
  const openedHere = useRef(false);

  // 사진을 여는 것은 화면 구성이 통째로 바뀌는 전환이다. nuqs 기본인 replace로 두면
  // 격자 주소가 히스토리에 남지 않아, 뒤로가기가 격자를 건너뛰고 상품 상세로 나간다
  const open = (at: number) => {
    openedHere.current = true;
    void setViewer(
      { photo: list[at].reviewId, n: indexWithinReview(list, at) },
      { history: "push" },
    );
  };

  /**
   * 뷰어를 닫는다.
   *
   * **격자에서 연 것은 되감고, 주소로 바로 들어온 것은 쿼리만 지운다.** 연 쪽이 기록을 한 칸
   * 쌓았으므로 닫을 때 `replace`로 지우면 같은 격자 기록이 둘 남아, 닫은 뒤 뒤로가기를 눌러도
   * 격자에 한 번 더 머문다. 바로 들어온 경우는 되감을 기록이 없어 그 반대다 — `back()`을
   * 부르면 이 화면 밖(앞서 보던 곳)으로 나간다.
   */
  const close = () => {
    if (openedHere.current) {
      openedHere.current = false;
      router.back();
      return;
    }
    void setViewer({ photo: null, n: null }, { history: "replace" });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 시안(1755-53664)의 헤더 제목은 "사진 리뷰"다. 목록 요약 줄(사진이 있는
          리뷰 N장)이 따로 있어 헤더까지 "전체보기"를 안 붙인다 */}
      <PageHeader title="사진 리뷰" />

      <main className="flex flex-1 flex-col">
        {isLoading && <PhotoGridSkeleton />}

        {/* 조회 실패는 토스트로 알리지 않는다(AppProviders 주석). 화면에서 무엇이 잘못됐는지 보여준다 */}
        {error && list.length === 0 && (
          <EmptyState role="alert" className="flex-1" {...APP_MESSAGE[toAppMessageCode(error)]} />
        )}

        {!isLoading && !error && list.length === 0 && (
          <EmptyState
            icon={<Icon name="cat" />}
            title="아직 사진 후기가 없어요"
            description="우리 아이가 맛있게 먹는 사진을 가장 먼저 자랑해 볼까요"
            className="py-16"
          />
        )}

        {list.length > 0 && (
          <>
            <p className="px-5 py-3 text-body-medium-16 text-text-body-default">
              사진이 있는 리뷰 {totalCount ?? list.length}
              <span className="text-label-bold-16">장</span>
            </p>

            {/* 시안은 좌우 20px 여백에 4px 간격 3열이다 */}
            <ul className="grid grid-cols-3 gap-1 px-5">
              {list.map((photo, at) => (
                <li key={`${photo.reviewId}-${photo.imageUrl}`}>
                  <button
                    type="button"
                    aria-label={`후기 사진 ${at + 1}번째 크게 보기`}
                    onClick={() => open(at)}
                    className="relative block aspect-square w-full overflow-hidden bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {/* 목록이라 lazy 그대로 둔다(AGENTS.md 5.6). 3열이라 화면 폭의 1/3쯤 쓴다 */}
                    <Image
                      src={photo.imageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 240px, 33vw"
                      className="object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>

            {/* 이 줄이 화면에 들어오면 다음 쪽을 부른다. 보이는 것은 없어 높이만 1px이다 */}
            {hasNext && !nextError && <div ref={loadMoreRef} aria-hidden className="h-px" />}
            {isLoadingNext && <PhotoGridSkeleton />}

            {nextError && (
              <p
                role="alert"
                className="px-5 py-6 text-center text-body-medium-14 text-text-body-secondary"
              >
                사진을 더 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
              </p>
            )}
          </>
        )}
      </main>

      {/* 주소에 후기 번호가 있으면 연다. 격자가 그 쪽까지 안 받았어도 뷰어가 그 후기를
          직접 받으므로, 깊은 쪽 사진을 공유한 주소도 그대로 열린다 */}
      {openedReviewId && (
        <PhotoViewer
          reviewId={openedReviewId}
          photoIndex={photoIndex}
          onPhotoChange={(next) => void setViewer({ n: next })}
          onClose={close}
          onBuy={() => router.push(`/products/${productId}`)}
        />
      )}
    </div>
  );
}
