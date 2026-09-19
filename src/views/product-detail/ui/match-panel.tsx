// 이 상품이 지금 고른 아이에게 얼마나 맞는지를 점수와 근거로 보여준다.
// 와이어프레임 기준(상품상세)이라 디자인 확정 시 바뀔 수 있다.
//
// 이 화면에서 서비스가 별점·인기순 나열과 갈라지는 자리다. 점수만 크게 띄우지 않고
// 무엇을 보고 그렇게 셌는지를 세 줄로 함께 편다.
//
// 도움이 되는 것만 늘어놓지 않는다. 지켜볼 것(나트륨이 높다 같은)을 같은 자리에
// 함께 적어야 근거로 읽힌다. 좋은 말만 있으면 광고와 구별되지 않는다.

"use client";

import { getMatchLevel } from "@/entities/product";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/shared/ui/select";

import type { PetMatch } from "../model/mock-product";

type MatchPanelProps = {
  /** 고를 수 있는 아이들. 지금 보고 있는 아이는 match가 정한다 */
  pets: { id: string; name: string }[];
  onPetChange: (petId: string) => void;
  match: PetMatch;
};

export function MatchPanel({ pets, onPetChange, match }: MatchPanelProps) {
  const level = getMatchLevel(match.score);
  // 이름은 적합도에서 가져온다. 목록에서 따로 찾으면 둘이 어긋났을 때
  // 이 아이 이름 아래 다른 아이의 근거가 붙는다
  const { petId, petName } = match;

  return (
    <section aria-labelledby="match-heading" className="flex flex-col gap-3 p-5">
      <Select value={petId} onValueChange={onPetChange}>
        <SelectTrigger
          aria-label="적합도 기준이 되는 아이"
          // 시안 높이(py-8 기준 34px 안팎)가 44px보다 작다. 보이는 높이는 시안대로 두고
          // 누르는 자리만 after로 안 보이게 44px까지 넓힌다
          className="relative w-auto gap-1 self-start rounded-full border-0 bg-surface-secondary px-3 py-2 text-label-medium-12 text-text-body-default after:absolute after:inset-x-0 after:-inset-y-1.25"
        >
          {petName} 기준으로 보고 있어요
        </SelectTrigger>
        {/* 기본값(item-aligned)은 고른 항목을 트리거 위에 겹쳐 놓아, 트리거가
            화면 아래쪽에 있으면 나머지 항목이 화면 밖으로 밀린다 */}
        <SelectContent position="popper" align="start">
          {pets.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name} 기준으로 보기
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        {/* 점수를 재지 못했으면 원을 채우지 않는다. 채워 두면 낮은 점수처럼 읽힌다 */}
        <span
          aria-hidden
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full text-title-bold-18",
            match.score === null
              ? "border border-border text-muted-foreground"
              : "bg-brand text-brand-foreground",
          )}
        >
          {match.score === null ? "?" : `${match.score}점`}
        </span>

        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id="match-heading" className="text-title-bold-16 text-text-body-default">
            {match.score === null
              ? `${petName} 기준으로는 아직 재지 못했어요`
              : `${petName}와 ${level.label}`}
          </h2>
          <p className="text-caption-regular-12 text-text-body-secondary">
            ({match.profileLabel} 기준)
          </p>
          <p className="sr-only">
            {match.score === null ? "상품 정보를 확인하는 중입니다" : `적합도 ${match.score}점`}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {match.reasons.map((reason) => (
          <li
            key={reason.text}
            className={cn(
              "flex items-center gap-1 text-body-medium-14",
              reason.tone === "good"
                ? "text-text-body-info-strong"
                : "text-text-body-danger-strong",
            )}
          >
            <Icon
              name={reason.tone === "good" ? "check" : "danger"}
              aria-hidden
              className={cn(
                "size-5 shrink-0",
                reason.tone === "good" ? "text-surface-info" : "text-icon-fill-red",
              )}
            />
            {/* 아이콘 모양만으로는 도움인지 주의인지 알 수 없다 */}
            <span className="sr-only">
              {reason.tone === "good" ? "도움되는 점." : "지켜볼 점."}
            </span>
            <span className="min-w-0">{reason.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
