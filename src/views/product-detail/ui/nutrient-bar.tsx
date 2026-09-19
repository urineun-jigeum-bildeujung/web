// 영양 성분 하나가 부족–적정–과다 중 어디에 있는지 막대로 보여준다.
// UI 시안 기준(상품 상세 영양 성분 분석, 1702-18866)이다.
//
// 시안은 적정을 초록, 과다를 빨강으로만 구분한다. 색을 구분하기 어려운 사람에게는
// 아무 정보가 아니므로, 막대 아래 부족/적정/과다 줄에서 지금 구간만 진하게 표시한다.
// 값 배지(예: "12%")는 숫자만 적고 구간 이름은 붙이지 않는다 — 시안이 그렇게 그렸다.
//
// 절대 기준치가 없는 성분(오메가3)은 구간을 재지 않는다. 눈금을 붙이면 가운데가
// 적정으로 읽혀 없는 판정을 만들어낸다.

import { cn } from "@/shared/lib/utils";

import type { Nutrient } from "../model/mock-product";

type NutrientBarProps = {
  nutrient: Nutrient;
};

const LEVEL_CLASS = {
  // halo는 손잡이 바깥의 옅은 원이다. 시안이 진한 색 위에 투명도를 준 게 아니라
  // 각 단계마다 정해둔 옅은 색 토큰을 그대로 쓴다(트랙 같은 회색 배경 위에서도
  // 늘 같은 색으로 보여야 하기 때문이다 — 투명도를 쓰면 바탕색에 따라 달라진다)
  low: {
    dot: "bg-icon-fill-brand",
    halo: "bg-icon-fill-light-brand",
    chip: "bg-brand text-brand-foreground",
  },
  proper: {
    dot: "bg-icon-fill-green",
    halo: "bg-icon-fill-light-green",
    chip: "bg-success text-success-foreground",
  },
  high: {
    dot: "bg-icon-fill-red",
    halo: "bg-icon-fill-light-red",
    chip: "bg-destructive text-destructive-foreground",
  },
  // 잰 것이 아니라 자리만 표시한다. 판정 색을 쓰면 좋고 나쁨으로 읽힌다
  unknown: {
    dot: "bg-icon-fill-default",
    halo: "bg-icon-fill-tertiary",
    chip: "bg-muted-foreground text-background",
  },
} as const;

/** 적정 구간을 기준으로 어느 쪽인지 가른다. 구간이 없으면 재지 않은 것이다 */
export function getNutrientLevel({ position, properRange }: Nutrient) {
  if (!properRange) return "unknown" as const;
  if (position < properRange[0]) return "low" as const;
  if (position > properRange[1]) return "high" as const;
  return "proper" as const;
}

export function NutrientBar({ nutrient }: NutrientBarProps) {
  const level = getNutrientLevel(nutrient);
  const { properRange } = nutrient;
  const percent = `${nutrient.position * 100}%`;

  return (
    // 시안(1702-18919)은 제목과 막대 사이 20px, 막대와 그 아래 줄(부족/적정/과다 또는
    // 안내 문구) 사이 12px로 서로 다르다 — 하나의 gap으로 묶지 않고 따로 준다
    <div className="flex flex-col gap-5 py-3">
      <p className="text-label-bold-16 text-text-body-default">{nutrient.name}</p>

      <div className="flex flex-col gap-3">
        {/* 값 배지+손잡이가 막대 위 제 자리에 뜬다. 이 둘은 시안에서 4px 틈을 두고
            이어진 한 덩어리이고, 손잡이는 막대의 세로 중앙에 온다. 배지가 그 위로
            튀어나오니 미리 자리를 비워 둔다(막대 자체의 위치 계산과 섞이지 않게
            바깥에 별도로 둔다) */}
        <div className="pt-8">
          <div className="relative h-1.5 w-full rounded-full bg-surface-tertiary">
            {/* bottom-1/2로 막대 세로 중앙에 손잡이 밑변을 맞춘 뒤, 손잡이 반지름(10px)만큼
                내려서 밑변이 아니라 중심이 그 자리에 오게 한다 */}
            <div
              className="absolute bottom-1/2 flex -translate-x-1/2 translate-y-2.5 flex-col items-center gap-1"
              style={{ left: percent }}
            >
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-label-bold-11 whitespace-nowrap",
                  LEVEL_CLASS[level].chip,
                )}
              >
                {/* 재지 않은 성분도 값만 적는다. 구간 이름은 아래 부족/적정/과다 줄이 맡는다 */}
                {nutrient.valueLabel}
              </span>
              {/* 손잡이는 진한 원 하나가 아니라 옅은 원(halo) 안에 진한 원이 겹친 두 겹이다 */}
              <span aria-hidden className="relative size-5">
                <span className={cn("absolute inset-0 rounded-full", LEVEL_CLASS[level].halo)} />
                <span className={cn("absolute inset-1 rounded-full", LEVEL_CLASS[level].dot)} />
              </span>
            </div>
          </div>
        </div>

        {properRange ? (
          <div aria-hidden className="flex justify-between text-label-bold-14">
            <span
              className={level === "low" ? "text-text-body-default" : "text-text-body-tertiary"}
            >
              부족
            </span>
            <span
              className={level === "proper" ? "text-text-body-default" : "text-text-body-tertiary"}
            >
              적정
            </span>
            <span
              className={level === "high" ? "text-text-body-default" : "text-text-body-tertiary"}
            >
              과다
            </span>
          </div>
        ) : (
          <p className="text-caption-regular-12 text-text-body-secondary">
            절대적 기준치가 없어 정상적으로 표기돼요
          </p>
        )}
      </div>
    </div>
  );
}
