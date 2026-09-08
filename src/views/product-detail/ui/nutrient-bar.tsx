// 영양 성분 하나가 부족–적정–과다 중 어디에 있는지 막대로 보여준다.
// 와이어프레임 기준(상품상세 영양 성분 분석)이라 디자인 확정 시 바뀔 수 있다.
//
// 시안은 적정을 초록, 과다를 빨강으로만 구분한다. 색을 구분하기 어려운 사람에게는
// 아무 정보가 아니므로, 값 배지에 구간 이름을 눈에 보이게 함께 적는다.
//
// 숨은 글자로만 두면 화면 낭독기 사용자에게만 닿는다. 화면은 보이지만 색을 가리기
// 어려운 사람에게는 여전히 색이 유일한 단서가 된다 (#131 리뷰).
//
// 절대 기준치가 없는 성분(오메가3)은 구간을 재지 않는다. 눈금을 붙이면 가운데가
// 적정으로 읽혀 없는 판정을 만들어낸다.

import { cn } from "@/shared/lib/utils";

import type { Nutrient } from "../model/mock-product";

type NutrientBarProps = {
  nutrient: Nutrient;
};

const LEVEL_CLASS = {
  low: { dot: "bg-brand", chip: "bg-brand text-brand-foreground" },
  proper: { dot: "bg-success", chip: "bg-success text-success-foreground" },
  high: { dot: "bg-destructive", chip: "bg-destructive text-destructive-foreground" },
  // 잰 것이 아니라 자리만 표시한다. 판정 색을 쓰면 좋고 나쁨으로 읽힌다
  unknown: { dot: "bg-muted-foreground", chip: "bg-muted-foreground text-background" },
} as const;

/** 적정 구간을 기준으로 어느 쪽인지 가른다. 구간이 없으면 재지 않은 것이다 */
export function getNutrientLevel({ position, properRange }: Nutrient) {
  if (!properRange) return "unknown" as const;
  if (position < properRange[0]) return "low" as const;
  if (position > properRange[1]) return "high" as const;
  return "proper" as const;
}

const LEVEL_LABEL = {
  low: "부족",
  proper: "적정",
  high: "과다",
  unknown: "기준 없음",
} as const;

/**
 * 배지를 값 위 어디에 붙일지.
 *
 * 늘 가운데에 맞추면 양 끝 값에서 배지가 화면 밖으로 밀려 글자가 잘린다.
 * 끝에서는 배지를 안쪽으로 당겨 붙인다 — 점은 제 자리에 남으므로 값의 위치는
 * 그대로 읽힌다.
 */
function badgeShift(position: number) {
  if (position <= 0.15) return "translate-x-0";
  if (position >= 0.85) return "-translate-x-full";
  return "-translate-x-1/2";
}

export function NutrientBar({ nutrient }: NutrientBarProps) {
  const level = getNutrientLevel(nutrient);
  const { properRange } = nutrient;
  const percent = `${nutrient.position * 100}%`;

  return (
    <div className="flex flex-col gap-2 py-3">
      <p className="text-sm font-bold text-foreground">{nutrient.name}</p>

      {/* 값 배지가 막대 위 제 자리에 뜬다. 배지 높이만큼 위쪽을 비워 둔다 */}
      <div className="relative pt-6">
        <span
          className={cn(
            "absolute top-0 rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap",
            badgeShift(nutrient.position),
            LEVEL_CLASS[level].chip,
          )}
          style={{ left: percent }}
        >
          {/* 색이 곧 판정이라 구간 이름을 눈에 보이게 붙인다. 재지 않은 성분은
              막대 아래에 그 사실을 적으므로 여기서 되풀이하지 않는다 */}
          {properRange ? `${nutrient.valueLabel} ${LEVEL_LABEL[level]}` : nutrient.valueLabel}
        </span>

        <div className="relative h-1.5 w-full rounded-full bg-muted">
          {properRange && (
            <span
              aria-hidden
              className="absolute inset-y-0 rounded-full bg-muted-foreground/50"
              style={{
                left: `${properRange[0] * 100}%`,
                right: `${(1 - properRange[1]) * 100}%`,
              }}
            />
          )}
          <span
            aria-hidden
            className={cn(
              "absolute top-1/2 size-3.5 -translate-1/2 rounded-full",
              LEVEL_CLASS[level].dot,
            )}
            style={{ left: percent }}
          />
        </div>
      </div>

      {properRange ? (
        <div aria-hidden className="flex justify-between text-xs">
          <span className="text-muted-foreground">부족</span>
          <span className="font-medium text-foreground">적정</span>
          <span className="text-muted-foreground">과다</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">절대 기준치가 없어 상대적으로만 표기해요</p>
      )}
    </div>
  );
}
