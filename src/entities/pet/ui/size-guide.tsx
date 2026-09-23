// 강아지 체구(초소형·소형·중형·대형)를 몸무게 몇 kg으로 가르는지 알려주는 물음표와 그 말풍선.
// UI 시안 기준(onbo_003_체구툴팁)이다.
//
// hover가 아니라 눌러서 여닫는다. 터치 기기에는 hover가 없고, 시안에도 닫기 버튼이 있다.
// 그래서 Tooltip이 아니라 Popover다.

"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import { Icon } from "@/shared/ui/icon/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import { SIZE_GUIDE } from "../model/breeds";

export function SizeGuide() {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="체구 기준 보기"
        // 시안의 아이콘은 24px이지만 탭 영역은 44px을 확보한다
        className="relative flex size-6 items-center justify-center rounded-full text-icon-fill-secondary transition-colors after:absolute after:-inset-2.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Icon name="question" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        alignOffset={-8}
        sideOffset={8}
        className="w-auto flex-row items-start gap-2 rounded-lg bg-primary p-2 text-body-medium-14 text-primary-foreground shadow-none ring-0"
      >
        <div>
          {SIZE_GUIDE.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <PopoverPrimitive.Close
          aria-label="닫기"
          className="relative flex size-6 shrink-0 items-center justify-center rounded-full after:absolute after:-inset-2.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Icon name="cancel" className="size-4" />
        </PopoverPrimitive.Close>
        <PopoverPrimitive.Arrow width={16} height={8} className="fill-primary" />
      </PopoverContent>
    </Popover>
  );
}
