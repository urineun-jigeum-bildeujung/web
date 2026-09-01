// 두 상품의 스펙을 항목별로 나란히 놓는 표. 가운데가 항목 이름이고 좌우가 값이다.
// 와이어프레임 기준(comp_001)이라 디자인 확정 시 바뀔 수 있다.
//
// 표로 짜는 이유가 있다. 화면에서는 라벨이 가운데 있어 눈으로 좌우를 견주지만,
// 스크린 리더는 "어느 상품의 어느 항목인지"를 읽어야 값의 의미가 산다.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

export type CompareRow = {
  /** 항목 이름. "10g당 가격", "주원료" 같은 것. */
  label: string;
  /** 두 상품의 값. 줄이 나뉘면 배열로 준다. */
  values: [string | string[], string | string[]];
};

type CompareTableProps = {
  /** 표의 두 열이 각각 어느 상품인지. 스크린 리더가 읽는다. */
  productNames: [string, string];
  rows: CompareRow[];
} & ComponentProps<"table">;

function Cell({ value }: { value: string | string[] }) {
  const lines = Array.isArray(value) ? value : [value];
  return (
    <>
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </>
  );
}

export function CompareTable({ productNames, rows, className, ...props }: CompareTableProps) {
  return (
    <table className={cn("w-full text-center text-sm", className)} {...props}>
      {/* 열이 무엇인지 눈으로는 위쪽 상품 카드가 알려 준다. 여기서는 읽히기만 하면 된다. */}
      <caption className="sr-only">
        {productNames[0]}와 {productNames[1]} 비교
      </caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">{productNames[0]}</th>
          <th scope="col">항목</th>
          <th scope="col">{productNames[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-border last:border-b-0">
            <td className="w-[35%] px-2 py-3 break-keep text-foreground">
              <Cell value={row.values[0]} />
            </td>
            {/* break-keep이 없으면 "핵심 기 / 능성"처럼 낱말 가운데가 잘린다. */}
            <th
              scope="row"
              className="px-1 py-3 text-xs font-medium break-keep text-muted-foreground"
            >
              {row.label}
            </th>
            <td className="w-[35%] px-2 py-3 break-keep text-foreground">
              <Cell value={row.values[1]} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
