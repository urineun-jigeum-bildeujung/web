// 신청 화면의 흰 카드 한 장. 제목 옆에 필수·선택 뱃지가 붙는다.
// UI 시안 기준(mypa_261 3333:37439 · mypa_361 3324:38944의 카드)이다. 안쪽 좌우 12·위아래 16,
// 모서리 8, 제목 title/bold_18 (#408).

import { useId, type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge/badge";

type ClaimSectionProps = {
  title: string;
  /** 제목 옆 뱃지. 환불 안내처럼 입력하지 않는 카드는 달지 않는다 */
  badge?: "required" | "optional";
  /** 카드 안 입력이 제목을 이름으로 쓸 때 넘긴다. 없으면 카드가 만든다 */
  headingId?: string;
  children: ReactNode;
  className?: string;
};

export function ClaimSection({ title, badge, headingId, children, className }: ClaimSectionProps) {
  const ownId = useId();
  const id = headingId ?? ownId;

  return (
    <section
      aria-labelledby={id}
      className={cn("flex flex-col gap-3 rounded-lg bg-card px-3 py-4", className)}
    >
      <div className="flex items-center gap-2">
        {/* 뱃지는 제목 밖에 둔다. 제목이 입력의 이름이 되는데 "필수"까지 읽히면 이름이 길어진다 */}
        <h2 id={id} className="text-title-bold-18 text-foreground">
          {title}
        </h2>
        {badge && (
          <Badge tone={badge === "required" ? "brand" : "default"}>
            {badge === "required" ? "필수" : "선택"}
          </Badge>
        )}
      </div>
      {children}
    </section>
  );
}
