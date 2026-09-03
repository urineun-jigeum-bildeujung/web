// 남은 시간을 시:분:초로 세어 내리는 표시.
// 와이어프레임 기준(메인, 타임딜)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/utils";

type CountdownProps = {
  /** 언제까지인지 */
  endsAt: Date;
  /** 다 지났을 때 대신 보여줄 것 */
  fallback?: React.ReactNode;
  className?: string;
};

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

export function Countdown({ endsAt, fallback, className }: CountdownProps) {
  // 서버와 클라이언트의 시각이 달라 하이드레이션이 어긋난다. 처음에는 그리지 않고
  // 화면에 붙은 뒤부터 센다.
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(endsAt.getTime() - Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (left === null) {
    // 자리를 미리 잡아 둔다. 숫자가 들어올 때 화면이 밀리지 않게 한다.
    return <p className={cn("text-2xl font-bold text-transparent", className)}>00 : 00 : 00</p>;
  }

  if (left <= 0) return <>{fallback}</>;

  const { hours, minutes, seconds } = split(left);

  return (
    <p className={cn("text-2xl font-bold text-foreground", className)}>
      {/* 1초마다 바뀌는 값이라 읽어 주면 방해가 된다. 남은 시간은 옆 문구가 알린다 */}
      <span aria-hidden>{`${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`}</span>
      <span className="sr-only">{`${hours}시간 ${minutes}분 남음`}</span>
    </p>
  );
}
