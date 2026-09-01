// 항목 이름과 값을 한 줄에 나란히 보여준다. 내 정보처럼 읽기 위주 화면에 쓴다.
// 와이어프레임 기준(mypa_011 닉네임·이름·생년월일·휴대폰 번호)이라 디자인 확정 시 바뀔 수 있다.

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type DefinitionRowProps = {
  /** 항목 이름 */
  term: ReactNode;
  /** 값. 없으면 빈칸으로 둔다 */
  description?: ReactNode;
  /** 값이 없을 때 대신 보여줄 문구 */
  emptyText?: string;
  /** 값을 오른쪽 끝에 붙인다. 금액처럼 자릿수를 견주는 값에 쓴다 */
  alignEnd?: boolean;
} & ComponentProps<"div">;

export function DefinitionRow({
  term,
  description,
  emptyText = "등록 전",
  alignEnd,
  className,
  ...props
}: DefinitionRowProps) {
  const isEmpty = description === undefined || description === null || description === "";

  return (
    <div className={cn("flex min-h-12 items-center gap-4 px-4 py-2", className)} {...props}>
      <dt className="w-24 shrink-0 text-sm text-muted-foreground">{term}</dt>
      <dd
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          alignEnd && "text-right",
          isEmpty ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {isEmpty ? emptyText : description}
      </dd>
    </div>
  );
}
