// cn 유틸리티 단위 테스트. 조건부 병합, Tailwind 충돌 해소, 타이포 토큰이 색과 겹쳐도 남는지 본다.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { TYPO_TOKENS } from "./typo/typo-tokens";
import { cn } from "./utils";

describe("cn", () => {
  it("조건부 클래스를 병합한다", () => {
    expect(cn("flex", false && "hidden", "gap-2")).toBe("flex gap-2");
  });

  it("충돌하는 Tailwind 클래스는 뒤에 온 것이 이긴다", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("배열과 객체 형태의 입력도 처리한다", () => {
    expect(cn(["flex", { hidden: false, "gap-2": true }])).toBe("flex gap-2");
  });
});

describe("타이포 토큰 (#176)", () => {
  // tailwind-merge가 text-title-bold-20을 색으로 보고 text-foreground와 겹친다며 지웠다
  it("글자색과 같이 써도 지워지지 않는다", () => {
    expect(cn("text-title-bold-20", "text-foreground")).toBe("text-title-bold-20 text-foreground");
    expect(cn("rounded-lg text-body-medium-14", "text-text-body-secondary")).toBe(
      "rounded-lg text-body-medium-14 text-text-body-secondary",
    );
  });

  it("타이포끼리, 그리고 Tailwind 기본 크기와는 뒤에 온 것이 이긴다", () => {
    expect(cn("text-sm", "text-title-bold-20")).toBe("text-title-bold-20");
    expect(cn("text-label-medium-14", "text-label-bold-14")).toBe("text-label-bold-14");
  });

  it("색끼리는 여전히 뒤에 온 것이 이긴다", () => {
    expect(cn("text-foreground", "text-text-body-secondary")).toBe("text-text-body-secondary");
  });

  // 목록이 globals.css와 어긋나면 새 토큰이 다시 색으로 오인된다
  it("토큰 목록이 globals.css의 타이포 정의와 같다", () => {
    const css = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf8");
    // 타이포 토큰만 --line-height 하위 속성을 갖는다. 색 변수(--text-body-default)와 구분된다
    const defined = [...css.matchAll(/^\s+--text-([a-z0-9-]+)--line-height:/gm)].map((m) => m[1]);

    expect([...TYPO_TOKENS].sort()).toEqual(defined.sort());
  });
});
