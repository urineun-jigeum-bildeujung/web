// 받침에 따라 조사가 갈리는지, 한글이 아닌 이름에서 깨지지 않는지 본다.
import { describe, expect, it } from "vitest";

import { hasFinalConsonant, josa, withJosa } from "./josa";

describe("josa", () => {
  it("받침이 있으면 앞쪽 조사를 쓴다", () => {
    expect(josa("햇살", "은/는")).toBe("은");
    expect(josa("햇살", "이/가")).toBe("이");
    expect(josa("햇살", "을/를")).toBe("을");
  });

  it("받침이 없으면 뒤쪽 조사를 쓴다", () => {
    expect(josa("소리", "은/는")).toBe("는");
    expect(josa("코코", "이/가")).toBe("가");
    expect(josa("봄이", "을/를")).toBe("를");
  });

  it("으로·로는 ㄹ 받침이 예외다", () => {
    // "서울으로"가 아니라 "서울로"다
    expect(josa("서울", "으로/로")).toBe("로");
    expect(josa("햇살", "으로/로")).toBe("로");
    // 다른 받침은 "으로"
    expect(josa("부산", "으로/로")).toBe("으로");
    expect(josa("소리", "으로/로")).toBe("로");
  });

  it("한글이 아니면 받침이 없는 것으로 본다", () => {
    // 영문·숫자 이름에서 깨지지 않기만 하면 된다
    expect(josa("Coco", "은/는")).toBe("는");
    expect(josa("", "은/는")).toBe("는");
    expect(hasFinalConsonant("Coco")).toBe(false);
  });

  it("이름과 조사를 붙여 돌려준다", () => {
    expect(withJosa("햇살", "은/는")).toBe("햇살은");
    expect(withJosa("소리", "은/는")).toBe("소리는");
  });
});
