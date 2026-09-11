// 리뷰 한 장. 누가 어떤 아이와 함께 썼는지가 별점만큼 중요하다.
// 와이어프레임 기준(상품 상세_리뷰 탭)이라 디자인 확정 시 바뀔 수 있다.
//
// 같은 사료라도 4kg 말티즈와 30kg 리트리버의 후기는 다른 이야기다. 별점만 나열하면
// 그 차이가 사라지므로 품종·나이·체중을 이름 바로 아래에 둔다.

"use client";

import { useState } from "react";
import { IoImageOutline, IoThumbsUpOutline } from "react-icons/io5";
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
import { Rating } from "@/shared/ui/rating/rating";

export type Review = {
  id: string;
  nickname: string;
  /** "말티즈 · 8세 · 4kg" — 상품 상세의 적합도 카드와 같은 표기를 쓴다 */
  petProfile: string;
  /** 0~5 */
  rating: number;
  /** "2026. 08. 31" */
  date: string;
  /** 첨부 사진. 아직 받을 곳이 없어 몇 장인지만 알고 자리를 잡는다 */
  photoCount: number;
  /** 구매한 옵션. "90정 1박스" */
  option: string;
  /** "사용 3주차" · "재구매 2회" */
  tags: string[];
  content: string;
  likeCount: number;
};

type ReviewCardProps = {
  review: Review;
  /** 사진을 눌렀을 때. 없으면 누를 수 없다 */
  onPhotoClick?: (index: number) => void;
  className?: string;
};

export function ReviewCard({ review, onPhotoClick, className }: ReviewCardProps) {
  // 서버에 보낼 곳이 아직 없다. 누른 티는 나야 하므로 화면이 든다
  const [liked, setLiked] = useState(false);
  const [reporting, setReporting] = useState(false);

  const likeCount = review.likeCount + (liked ? 1 : 0);

  return (
    <article className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        {/* 프로필 사진을 받을 곳이 아직 없다 */}
        <span aria-hidden className="size-9 shrink-0 rounded-full bg-muted" />
        <div className="flex flex-col">
          <p className="text-sm font-medium text-foreground">{review.nickname}</p>
          <p className="text-xs text-muted-foreground">{review.petProfile}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Rating value={review.rating} />
        <span className="text-xs text-muted-foreground">{review.date}</span>
      </div>

      {review.photoCount > 0 && (
        <ul className="flex gap-2">
          {Array.from({ length: review.photoCount }, (_, index) => (
            <li key={index} className="flex-1">
              {onPhotoClick ? (
                <button
                  type="button"
                  aria-label={`${review.nickname}의 리뷰 사진 ${index + 1}번째 크게 보기`}
                  onClick={() => onPhotoClick(index)}
                  className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <IoImageOutline aria-hidden className="size-6 text-muted-foreground" />
                </button>
              ) : (
                <span
                  aria-hidden
                  className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted"
                >
                  <IoImageOutline className="size-6 text-muted-foreground" />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">[옵션] {review.option}</p>

      {review.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <li key={tag} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {tag}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm whitespace-pre-line text-foreground">{review.content}</p>

      <div className="flex items-center justify-between">
        {/* 신고는 되돌리기 어렵다. 누르는 순간 접수되는 것처럼 보이면 안 된다 */}
        <button
          type="button"
          onClick={() => setReporting(true)}
          className="flex min-h-11 items-center text-xs text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          신고하기
        </button>

        <button
          type="button"
          aria-pressed={liked}
          onClick={() => setLiked((prev) => !prev)}
          className={cn(
            "flex min-h-11 items-center gap-1 rounded-full border px-3 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            liked ? "border-primary text-primary" : "border-border text-muted-foreground",
          )}
        >
          <IoThumbsUpOutline aria-hidden className="size-4" />
          <span>{likeCount}</span>
          <span className="sr-only">이 후기가 도움이 됐어요</span>
        </button>
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
