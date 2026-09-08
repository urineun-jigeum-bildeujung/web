// 이 상품이 지금 고른 아이에게 얼마나 맞는지를 점수와 근거로 보여준다.
// 와이어프레임 기준(상품상세)이라 디자인 확정 시 바뀔 수 있다.
//
// 이 화면에서 서비스가 별점·인기순 나열과 갈라지는 자리다. 점수만 크게 띄우지 않고
// 무엇을 보고 그렇게 셌는지를 세 줄로 함께 편다.
//
// 도움이 되는 것만 늘어놓지 않는다. 지켜볼 것(나트륨이 높다 같은)을 같은 자리에
// 함께 적어야 근거로 읽힌다. 좋은 말만 있으면 광고와 구별되지 않는다.

"use client";

import { IoAlertCircleOutline, IoCheckmark, IoPaw } from "react-icons/io5";

import { getMatchLevel } from "@/entities/product";
import { cn } from "@/shared/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/shared/ui/select";

import type { PetMatch } from "../model/mock-product";

type MatchPanelProps = {
  pets: { id: string; name: string }[];
  petId: string;
  onPetChange: (petId: string) => void;
  match: PetMatch;
};

export function MatchPanel({ pets, petId, onPetChange, match }: MatchPanelProps) {
  const pet = pets.find((item) => item.id === petId);
  const level = getMatchLevel(match.score);

  return (
    <section aria-labelledby="match-heading" className="flex flex-col gap-3 px-4 py-5">
      <Select value={petId} onValueChange={onPetChange}>
        <SelectTrigger
          aria-label="적합도 기준이 되는 아이"
          className="min-h-11 w-auto gap-2 rounded-full border-0 bg-muted px-4 text-sm text-muted-foreground"
        >
          <IoPaw aria-hidden className="size-4" />
          {pet?.name} 기준으로 보고 있어요
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

      <div className="flex items-center gap-3">
        {/* 점수를 재지 못했으면 원을 채우지 않는다. 채워 두면 낮은 점수처럼 읽힌다 */}
        <span
          aria-hidden
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-full text-base font-bold",
            match.score === null
              ? "border border-border text-muted-foreground"
              : "bg-brand text-brand-foreground",
          )}
        >
          {match.score === null ? "?" : `${match.score}점`}
        </span>

        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id="match-heading" className="text-base font-bold text-foreground">
            {match.score === null
              ? `${pet?.name} 기준으로는 아직 재지 못했어요`
              : `${pet?.name}와 ${level.label}`}
          </h2>
          <p className="text-xs text-muted-foreground">({match.profileLabel} 기준)</p>
          <p className="sr-only">
            {match.score === null ? "상품 정보를 확인하는 중입니다" : `적합도 ${match.score}점`}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {match.reasons.map((reason) => {
          const Icon = reason.tone === "good" ? IoCheckmark : IoAlertCircleOutline;
          return (
            <li key={reason.text} className="flex items-start gap-2 text-sm text-foreground">
              <Icon
                aria-hidden
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  reason.tone === "good" ? "text-foreground" : "text-brand",
                )}
              />
              {/* 아이콘 모양만으로는 도움인지 주의인지 알 수 없다 */}
              <span className="sr-only">
                {reason.tone === "good" ? "도움되는 점." : "지켜볼 점."}
              </span>
              <span className="min-w-0">{reason.text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
