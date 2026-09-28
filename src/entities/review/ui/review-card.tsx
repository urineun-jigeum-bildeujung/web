// 리뷰 한 장. 누가 어떤 아이와 함께 썼는지가 별점만큼 중요하다.
// 와이어프레임 기준(상품 상세_리뷰 탭)이라 디자인 확정 시 바뀔 수 있다.
//
// 같은 사료라도 4kg 말티즈와 30kg 리트리버의 후기는 다른 이야기다. 별점만 나열하면
// 그 차이가 사라지므로 아이 정보를 이름 바로 아래에 둔다(`lib/pet-label`).
//
// 아이가 여럿이면 글로만 적지 않고 원도 그만큼 포갠다. 원 하나에 아이 여럿을 담으면
// 몇 마리인지가 원에서 사라진다 (#488).

"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { avatarColor } from "@/shared/lib/avatar/avatar-color";
import { avatarInitials } from "@/shared/lib/avatar/avatar-initials";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";
import { Rating } from "@/shared/ui/rating/rating";

import { formatPetProfiles } from "../lib/pet-label";
import type { Review } from "../model/review";

type ReviewCardProps = {
  review: Review;
  /** 사진 리뷰 뷰어처럼 사진을 이미 큰 화면으로 보여주고 있을 때, 이 카드 안의
      아바타 원·사진 줄까지 다시 그리면 중복이라 뺀다(시안 1758-54280) */
  hideAvatar?: boolean;
  hidePhotos?: boolean;
  className?: string;
};

export function ReviewCard({ review, hideAvatar, hidePhotos, className }: ReviewCardProps) {
  const [reporting, setReporting] = useState(false);

  return (
    <article className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        {/* 원은 작성자가 아니라 **함께 먹인 아이들**이다. 한 건에 아이가 여럿일 수 있어
            시안대로 포개 놓는다. 닉네임이 비어도 아이는 알 수 있으므로 아래 아이 줄과 같은
            조건으로 그린다. 사진은 리뷰 응답에 없어 전부 이름 글자만 들어간다 (#488).

            아이 원 컴포넌트(`entities/pet`의 `PetPhoto`)를 가져다 쓸 수 없다 — 같은 레이어라
            의존 방향이 깨진다. 색과 글자를 만드는 함수만 `shared/lib/avatar`에서 함께 쓴다 */}
        {!hideAvatar && review.pets.length > 0 && (
          <span aria-hidden className="flex shrink-0 items-center">
            {review.pets.map((pet, index) => (
              <span
                key={pet.id}
                style={{
                  background: avatarColor(pet.id),
                  // **뒤에 오는 아이일수록 아래로 깔린다.** 그냥 두면 DOM에서 뒤 요소가 위에
                  // 그려져 시안과 반대가 된다
                  zIndex: review.pets.length - index,
                }}
                className={cn(
                  "relative flex size-10.5 items-center justify-center rounded-full text-label-bold-14 text-text-body-static-black",
                  // 시안의 겹침 간격 -24px. 42px 원이 18px씩 보인다
                  index > 0 && "-ml-6",
                )}
              >
                {avatarInitials(pet.name)}
              </span>
            ))}
          </span>
        )}
        {/* 시안(1716:34336)의 이름↔아이 줄 간격이 4px이다 */}
        <div className="flex flex-col gap-1">
          {review.nickname && (
            <p className="text-label-bold-14 text-text-body-default">{review.nickname}</p>
          )}
          {/* 아이가 여럿이면 줄이지 않고 전부 적는다. 첫 마리만 적으면 사실과 달라진다 */}
          <p className="text-label-medium-11 text-text-body-secondary">
            {formatPetProfiles(review.pets)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Rating value={review.rating} />
        <span className="text-label-medium-11 text-text-body-secondary">{review.date}</span>
      </div>

      {!hidePhotos && review.images.length > 0 && (
        <ul className="flex gap-1">
          {review.images.map((url, index) => (
            <li key={`${index}-${url}`} className="flex-1">
              {/* 목록 안이라 lazy 그대로 둔다(AGENTS.md 5.6). 3열이라 화면 폭의 1/3쯤 쓴다 */}
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={url}
                  alt={`후기 사진 ${index + 1}번째`}
                  fill
                  sizes="(min-width: 768px) 200px, 33vw"
                  className="object-cover"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {review.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-sm bg-surface-secondary px-1 py-0.5 text-label-medium-12 text-text-body-secondary"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <p className="text-body-medium-14 whitespace-pre-line text-text-body-default">
        {review.content}
      </p>

      <div className="flex items-center justify-between">
        {/* 신고는 되돌리기 어렵다. 누르는 순간 접수되는 것처럼 보이면 안 된다 */}
        <button
          type="button"
          onClick={() => setReporting(true)}
          className="flex min-h-11 items-center text-caption-regular-12 text-text-body-secondary underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          신고하기
        </button>

        {/* 인증 UX가 확정될 때까지 도움돼요 수만 읽기 전용으로 표시한다 */}
        <p className="flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-label-medium-12 text-icon-fill-secondary">
          <Icon name="thumbs_up" aria-hidden className="size-5" />
          <span>{review.likeCount}</span>
          <span className="sr-only">명이 이 후기가 도움이 됐다고 했어요</span>
        </p>
      </div>

      <AlertDialog open={reporting} onOpenChange={setReporting}>
        <AlertDialogContent>
          <AlertDialogTitle>이 후기를 신고할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            확인 후 조치하며, 결과는 따로 알려드리지 않아요
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">닫기</AlertDialogCancel>
            {/* 신고 접수 API가 아직 없다. 계약이 정해지면 이 자리에서 부른다 */}
            <AlertDialogAction
              className="min-h-11"
              onClick={() => toast.success("신고가 접수됐어요")}
            >
              신고하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
