// 메인 최상단 프로모션 배너. 3장이 저절로 넘어가고, 밀거나 점을 눌러 옮길 수도 있다.
//
// **배너는 백엔드가 주지 않기로 정해져 정적 자산과 배열로 들고 있다(#615).** 순서는 이 배열이
// 정하므로 파일명에는 번호를 넣지 않는다 — PD가 한 장만 갈아끼워도 이름으로 어느 배너인지 안다.
//
// **자리는 전달받은 원본의 3:2를 쓴다.** 시안 프레임은 4:3(353×265)이지만 원본을 그 비율로
// 자르면 좌우가 5.6%씩 잘리면서 이미지 안 문구가 잘린다. 원본을 자르지 않은 상태로 먼저 배포해
// QA하고, 그 결과에 따라 4:3 자산을 다시 받거나 영역 비율을 조정한다(#616).

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

/** 디자인팀이 의도한 순서 그대로다. 문구가 이미지 안에 있어 대체 텍스트로 옮긴다 */
const BANNERS = [
  {
    src: "/images/home/promo-timedeal.webp",
    alt: "지금, 우리 아이를 위한 타임딜 특가. 놓치면 아쉬운 한정 특가. 최대 25% 할인, 인기 상품 한정",
  },
  {
    src: "/images/home/promo-treat.webp",
    alt: "자연 그대로 건강한 간식. 좋은 재료로 만든 우리 아이의 특별한 간식. 최대 25% 할인, 인기 상품 한정",
  },
  {
    src: "/images/home/promo-immune-care.webp",
    alt: "면역 케어 영양제. 오늘도 건강한 우리 아이. 최대 25% 할인, 인기 상품 한정",
  },
];

/**
 * 자동 전환 간격.
 *
 * 홍보 문구가 이미지 안에 있어 읽을 시간이 필요하다. 근거 없이 더 줄이지 않는다.
 * 시안 프로토타입 설정과 대조할 값이라 한 곳에 모아 둔다(#616).
 */
const AUTO_ADVANCE_MS = 5000;

/** 배너 순번을 실제 있는 범위로 묶는다 */
function clamp(index: number) {
  return Math.min(Math.max(index, 0), BANNERS.length - 1);
}

export function PromoBannerCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  // 자동 전환은 다음 장을 알아야 하는데 state는 다음 타이머가 돌 때까지 낡는다.
  // 화면에 그리는 값은 state가, 타이머가 읽는 값은 이 ref가 맡는다
  const shownRef = useRef(0);
  const [shown, setShown] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  // 손으로 옮긴 직후에 자동 전환이 곧바로 이어지면 방금 고른 배너를 뺏긴다.
  // 이 값이 바뀌면 아래 타이머가 처음부터 다시 간다. 값 자체는 쓰지 않아 시각이 아니라
  // 세는 수다 — 같은 밀리초에 두 번 눌려도 반드시 달라진다
  const [restartToken, setRestartToken] = useState(0);

  function show(index: number) {
    shownRef.current = index;
    setShown(index);

    const track = trackRef.current;
    // 옮기는 거리는 레이아웃이 정한다. `behavior`를 주지 않아 아래 motion-safe가 부드러움을 맡는다
    track?.scrollTo({ left: index * track.clientWidth });
  }

  /** 사용자가 직접 옮겼다. 자동 전환 시계를 여기서부터 다시 센다 */
  function restartAutoAdvance() {
    setRestartToken((token) => token + 1);
  }

  // 움직임 줄이기를 켠 사용자에게는 저절로 넘기지 않는다. 보는 중에 설정을 바꿔도 따른다
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;

    const timer = setInterval(() => show((shownRef.current + 1) % BANNERS.length), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion, restartToken]);

  return (
    // 읽는 중에 넘어가면 방해가 된다. 마우스가 올라오거나 키보드 초점이 들어오면 멈춘다.
    // 시안에 일시정지 버튼이 없어 화면에 보이는 것은 늘리지 않았다. 터치 기기에는 호버가 없어
    // 영구히 멈출 수단이 필요하고, 그 모양과 자리는 배포 뒤 PD와 정한다(#616)
    <section
      aria-label="진행 중인 행사"
      className="relative p-5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div
        ref={trackRef}
        // 미는 동작은 여기서 시작한다. 스크롤 이벤트는 자동 전환이 옮길 때도 나서 가리지 못한다
        onPointerDown={restartAutoAdvance}
        onScroll={(event) => {
          const track = event.currentTarget;
          if (track.clientWidth === 0) return;

          // 모바일의 탄성 스크롤에서는 scrollLeft가 음수이거나 마지막 장을 넘어선 값으로도 온다.
          // 그대로 쓰면 없는 배너를 가리켜 점이 셋 다 꺼진다
          const index = clamp(Math.round(track.scrollLeft / track.clientWidth));
          shownRef.current = index;
          setShown(index);
        }}
        className={cn(
          "flex snap-x snap-mandatory overflow-x-auto rounded-lg bg-muted",
          "motion-safe:scroll-smooth",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {BANNERS.map((banner, index) => (
          <div key={banner.src} className="relative aspect-3/2 w-full shrink-0 snap-center">
            {/* 첫 화면 가장 큰 이미지라 첫 장만 먼저 받고 나머지는 볼 때 받는다(AGENTS 5.6) —
                Next 16에서 `priority`가 `preload`로 이름이 바뀌었다(next/dist/docs의 image.md).
                폭은 이 화면이 직접 정한다(#496). 섹션이 p-5로 좌우 20씩 먹으므로
                1200에서 멈춘 뒤에는 1160px이고, 그 아래로는 뷰포트를 따라간다 */}
            <Image
              src={banner.src}
              alt={banner.alt}
              fill
              preload={index === 0}
              sizes="(min-width: 1200px) 1160px, calc(100vw - 40px)"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {/* 점은 장식이 아니라 지금 어느 배너인지와 옮기는 수단이다.
          시안(Frame 31)은 사진 박스가 아니라 padding을 포함한 이 섹션 기준 bottom-[29.75px]다.
          비선택 원은 라이트/다크 각각 surface/default(흰색/#141414)라 고정 흰색이 아니라
          모드에 따라 바뀌는 토큰(bg-background)을 쓴다.
          누르는 자리만 24px 높이로 넓히고 원은 6px 그대로 둔다. 버튼끼리 붙여 시안의 4px 간격을 지킨다 */}
      <div className="absolute bottom-[29.75px] left-1/2 flex -translate-x-1/2">
        {BANNERS.map((banner, index) => (
          <button
            key={banner.src}
            type="button"
            aria-label={`${index + 1}번 배너 보기`}
            aria-current={index === shown ? true : undefined}
            onClick={() => {
              show(index);
              restartAutoAdvance();
            }}
            className="flex h-6 w-2.5 items-center justify-center"
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                index === shown ? "bg-primary" : "bg-background",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
