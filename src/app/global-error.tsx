"use client";
// 루트 레이아웃까지 깨졌을 때의 마지막 화면. html·body를 직접 그린다.
//
// error.tsx는 레이아웃 안에서 렌더되므로 레이아웃 자체가 실패하면 뜨지 못한다.
// 이 파일이 그 경우를 맡고, Next.js가 루트를 대체하므로 html·body가 여기 있어야 한다.
//
// 레이아웃이 죽은 상황이라 폰트도 토큰도 믿을 수 없다. Provider도 없어 Toaster가 없고,
// 그래서 공용 컴포넌트를 쓰지 않고 인라인 스타일로만 그린다. 화면에 무엇이든 뜨는 것이 먼저다.
//
// 관측 도구를 붙일 때 여기가 "에러를 바깥으로 보고하는 자리"가 된다.

import { useEffect } from "react";

import { reportError } from "@/shared/lib/report-error";

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    reportError("global error", error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#141414",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>문제가 생겼어요</p>
          <p style={{ margin: 0, fontSize: 14, color: "#565d6d" }}>잠시 후 다시 열어 주세요.</p>
        </div>

        {/* reset()은 루트를 다시 그리는데, 레이아웃이 깨진 원인이 남아 있으면 같은 화면으로 돌아온다.
            여기서는 새로고침으로 처음부터 다시 받게 한다. */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            minHeight: 44,
            padding: "0 20px",
            borderRadius: 8,
            border: "1px solid #dddee3",
            background: "#ffffff",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          새로고침
        </button>
      </body>
    </html>
  );
}
