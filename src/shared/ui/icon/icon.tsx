// 디자인 시스템 아이콘. 이름으로 고르고 크기는 size-*, 색은 글자색(currentColor)으로 정한다.
// Figma `골라주개냥 Design System` > `icon` 페이지(151:257)가 원본이다.
//
// 그림 데이터는 `icon-shapes.ts`에 있고 스크립트로 만든다. 여기서는 그리기만 한다.
// 기본은 장식(aria-hidden)이다. 뜻을 전해야 하면 `label`을 주면 이미지로 읽힌다.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

import { ICON_SHAPES, type IconName } from "./icon-shapes";

type IconProps = {
  name: IconName;
  /** 스크린 리더가 읽을 이름. 없으면 장식으로 숨긴다 */
  label?: string;
} & Omit<ComponentProps<"svg">, "children" | "aria-label" | "aria-hidden" | "role">;

export function Icon({ name, label, className, ...props }: IconProps) {
  const { paths, transform } = ICON_SHAPES[name];

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      // 시안 icon/height/m(24px)이 기본. 호출부가 size-*로 바꾼다
      className={cn("size-6 shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...props}
    >
      <g transform={transform}>
        {/* 목록이 고정이라 순서를 키로 써도 된다 */}
        {paths.map((path, index) => (
          <path
            key={index}
            d={path.d}
            fillRule={path.fillRule}
            clipRule={path.clipRule}
            fillOpacity={path.opacity}
          />
        ))}
      </g>
      {/* 알림이 있는 종. 점은 글자색이 아니라 브랜드색이라 따로 그린다 */}
      {name === "bell_noti" && <circle cx="21" cy="3" r="3" className="fill-surface-brand" />}
    </svg>
  );
}
