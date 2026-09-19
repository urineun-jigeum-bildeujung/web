// 남은 시간을 시:분:초로 세어 내리는 표시.
// UI 시안 기준(메인 타임딜 섹션, 1758-68883)이다.
// 시안은 32px Regular인데 이 크기의 토큰이 없다(가장 큰 게 28px, 그것도 Bold뿐).
// 가장 가까운 기존 토큰(28px Bold)의 크기·줄간격만 가져오고 굵기는 font-normal로
// 덮어써 근사해 뒀다. 디자인팀에 32px 토큰 추가 여부를 확인해 정확한 값으로 바꿔야 한다.

"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

type CountdownProps = {
  /** 언제까지인지 */
  endsAt: Date;
  /** 다 지났을 때 대신 보여줄 것 */
  fallback?: React.ReactNode;
  /** 다 지났을 때 알린다. 끝난 뒤 화면이 통째로 바뀌어야 하는 자리에서 쓴다 */
  onEnd?: () => void;
  className?: string;
  /** 배지처럼 좁은 자리에 넣을 때. 콜론 사이 공백 없이 "02:14:33"으로 붙여 쓴다 */
  compact?: boolean;
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

export function Countdown({ endsAt, fallback, onEnd, className, compact }: CountdownProps) {
  // 서버와 클라이언트의 시각이 달라 하이드레이션이 어긋난다. 처음에는 그리지 않고
  // 화면에 붙은 뒤부터 센다.
  const [left, setLeft] = useState<number | null>(null);

  // 부르는 쪽이 인라인 함수를 넘기면 매 렌더마다 참조가 바뀐다.
  // 그것을 의존성에 두면 1초마다 타이머를 다시 건다.
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    const tick = () => {
      const next = endsAt.getTime() - Date.now();
      setLeft(next);
      // 다 세고 나면 세는 것을 멈추고 부모에게 알린다.
      // 알리지 않으면 시간이 지나도 옆에 붙은 목록과 문구가 그대로 남는다.
      if (next <= 0) {
        clearInterval(timer);
        onEndRef.current?.();
      }
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [endsAt]);

  const separator = compact ? ":" : " : ";
  // compact는 문장 중간(배지·안내 문구)에 끼워 쓰므로 블록 요소(p)가 아니라
  // 인라인 요소(span)로 그려야 한다
  const Tag = compact ? "span" : "p";

  if (left === null) {
    // 자리를 미리 잡아 둔다. 숫자가 들어올 때 화면이 밀리지 않게 한다.
    return (
      <Tag className={cn("text-title-bold-28 font-normal text-transparent", className)}>
        {`00${separator}00${separator}00`}
      </Tag>
    );
  }

  if (left <= 0) return <>{fallback}</>;

  const { hours, minutes, seconds } = split(left);

  return (
    <Tag className={cn("text-title-bold-28 font-normal text-foreground", className)}>
      {/* 1초마다 바뀌는 값이라 읽어 주면 방해가 된다. 남은 시간은 옆 문구가 알린다 */}
      <span
        aria-hidden
      >{`${pad(hours)}${separator}${pad(minutes)}${separator}${pad(seconds)}`}</span>
      <span className="sr-only">{`${hours}시간 ${minutes}분 남음`}</span>
    </Tag>
  );
}
