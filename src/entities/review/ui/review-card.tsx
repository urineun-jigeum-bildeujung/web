// 리뷰 한 장. 누가 어떤 아이와 함께 썼는지가 별점만큼 중요하다.
// 와이어프레임 기준(상품 상세_리뷰 탭)이라 디자인 확정 시 바뀔 수 있다.
//
// 같은 사료라도 4kg 말티즈와 30kg 리트리버의 후기는 다른 이야기다. 별점만 나열하면
// 그 차이가 사라지므로 아이 정보를 이름 바로 아래에 둔다(`lib/pet-label`).

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
        {/* 프로필 사진을 받을 곳이 아직 없다. 시안은 원 안에 아이 이름을 넣는다. 아이 고르기 줄은
            이제 아이 원(`entities/pet`의 `PetPhoto`)으로 이름 앞 두 글자를 넣지만(#470), 리뷰 한 건에
            아이가 여럿일 수 있어 어느 아이를 넣을지 정해지지 않아 회색 원으로 둔다.
            **닉네임이 없으면 원도 그리지 않는다** — 누구인지 모르는데 자리만 남기는 꼴이 된다 */}
        {!hideAvatar && review.nickname && (
          <span aria-hidden className="size-10.5 shrink-0 rounded-full bg-surface-disable" />
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
