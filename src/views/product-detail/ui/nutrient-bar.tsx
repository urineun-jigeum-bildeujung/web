// 영양 성분 하나가 부족–적정–과다 중 어디에 있는지 막대로 보여준다.
// UI 시안 기준(상품 상세 영양 성분 분석, 1681-14278)이다.
//
// 시안은 지금 구간을 색으로만 구분한다 — 부족/적정/과다 세 글자는 굵기(700)가
// 모두 같고 text/body/default·tertiary 색만 다르며, 값 배지도 적정 초록·과다
// 빨강처럼 색으로 갈린다. 색을 구분하기 어려운 사람에게는 이 구분이 시안 그대로는
// 아직 전달되지 않는다 — 임의로 굵기·아이콘을 더하지 않고 시안을 그대로 옮겼고,
// 이 부분은 디자인팀 확인이 더 필요하다(과다·적정 배지 흰 글자의 APCA 재평가와
// 같은 종류의 보류 항목).
//
// 부족/적정/과다 줄은 세 성분마다 반복되는 눈금이라 aria-hidden으로 화면
// 낭독기를 건너뛰게 하는 대신, 값 배지의 aria-label에 구간 이름을 실어
// 보낸다("12%, 과다") — 화면엔 숫자만 보이고 화면 낭독기만 구간까지 듣는다.
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

const LEVEL_LABEL = {
  low: "부족",
  proper: "적정",
  high: "과다",
} as const;

/** 구간이 있는 성분만 화면 낭독기용 문구("12%, 과다")를 만든다 */
function accessibleValueLabel(nutrient: Nutrient, level: ReturnType<typeof getNutrientLevel>) {
  if (level === "unknown") return undefined;
  return `${nutrient.valueLabel}, ${LEVEL_LABEL[level]}`;
}

export function NutrientBar({ nutrient }: NutrientBarProps) {
  const level = getNutrientLevel(nutrient);
  const { properRange } = nutrient;
  const percent = `${nutrient.position * 100}%`;

  return (
    // 시안(1681-14278)은 제목과 막대 사이 20px, 막대와 그 아래 줄(부족/적정/과다 또는
    // 안내 문구) 사이 12px로 서로 다르다 — 하나의 gap으로 묶지 않고 따로 준다.
    // 값 배지+손잡이는 이 20px 틈 위로 겹쳐 뜨는 절대 위치라, 문서 흐름상 자리를
    // 따로 비워 두지 않는다 — 시안도 막대 바로 위 20px 자리를 그대로 쓴다
    <div className="flex flex-col gap-5 py-3">
      <p className="text-label-bold-16 text-text-body-default">{nutrient.name}</p>

      <div className="flex flex-col gap-3">
        <div className="relative h-1.5 w-full rounded-full bg-surface-tertiary">
          {/* bottom-1/2로 막대 세로 중앙에 손잡이 밑변을 맞춘 뒤, 손잡이 반지름(10px)만큼
              내려서 밑변이 아니라 중심이 그 자리에 오게 한다 */}
          <div
            className="absolute bottom-1/2 flex -translate-x-1/2 translate-y-2.5 flex-col items-center gap-1"
            style={{ left: percent }}
          >
            <span
              // 화면엔 숫자만 보이지만, 구간이 있으면 화면 낭독기는 "12%, 과다"처럼
              // 구간까지 듣는다 — 부족/적정/과다 줄은 aria-hidden이라 이 자리 말고는
              // 화면 낭독기에 구간을 전달할 곳이 없다
              aria-label={accessibleValueLabel(nutrient, level)}
              className={cn(
                "rounded-full px-2 py-0.5 text-label-bold-11 whitespace-nowrap",
                LEVEL_CLASS[level].chip,
              )}
            >
              {nutrient.valueLabel}
            </span>
            {/* 손잡이는 진한 원 하나가 아니라 옅은 원(halo) 안에 진한 원이 겹친 두 겹이다 */}
            <span aria-hidden className="relative size-5">
              <span className={cn("absolute inset-0 rounded-full", LEVEL_CLASS[level].halo)} />
              <span className={cn("absolute inset-1 rounded-full", LEVEL_CLASS[level].dot)} />
            </span>
          </div>
        </div>

        {properRange ? (
          // 시안(1681-14278)은 세 글자 모두 굵기가 같고(label/bold_14, 700) 색만
          // 다르다 — 지금 구간은 text/body/default(#141414), 나머지 둘은
          // text/body/tertiary(#868b94)다. 화면 낭독기에는 위 값 배지의 aria-label이
          // 구간을 이미 전했으니 이 줄은 건너뛰게 한다
          <div aria-hidden className="flex justify-between text-label-bold-14">
            {(["low", "proper", "high"] as const).map((key) => (
              <span
                key={key}
                className={level === key ? "text-text-body-default" : "text-text-body-tertiary"}
              >
                {LEVEL_LABEL[key]}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-caption-regular-12 text-text-body-secondary">
            절대적 기준치가 없어 상댓값만 표기돼요
          </p>
        )}
      </div>
    </div>
  );
}
