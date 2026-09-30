// 루트 레이아웃. 폰트 변수와 전역 스타일을 걸고 AppProviders로 감싼다.

import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/shared/lib/utils";
import { AppProviders } from "@/shared/providers/app-providers";
import { NewNotificationToaster } from "@/widgets/notification-bell";

// Figma 타이포 토큰이 전부 typo/pretendard를 참조한다. Google Fonts에 없어 파일을 직접 들고 있다.
// weight 셋만 받는 이유는 토큰이 400(label/regular_13)·500(medium)·700(bold)만 쓰기 때문이다.
// 통짜 대신 subset(한글 상용 2350자)이라 세 벌을 합쳐도 787KB다.
const pretendard = localFont({
  src: [
    { path: "./fonts/Pretendard-Regular.subset.woff2", weight: "400" },
    { path: "./fonts/Pretendard-Medium.subset.woff2", weight: "500" },
    { path: "./fonts/Pretendard-Bold.subset.woff2", weight: "700" },
  ],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "골라주개냥",
    template: "%s | 골라주개냥",
  },
  description: "고민은 줄이고, 우리 애한테 맞게 골라주개냥",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes가 하이드레이션 전에 html에 `dark` 클래스를 붙인다. 서버가 그린 값과 달라지는 것이 정상이라 이 한 층만 경고를 끈다(#565)
    <html
      lang="ko"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistMono.variable, "font-sans", pretendard.variable)}
    >
      <body className="min-h-full">
        {/* 폭 제한은 여기 없다. 태블릿·웹 시안이 온 화면부터 넓어져야 하므로
            `(constrained)` 라우트 그룹의 레이아웃이 420px 기둥을 진다(#491).
            아직 시안이 없는 화면은 그 그룹 안에 있어 모바일 폭 그대로다.

            폭을 body가 아니라 div 층에서 다루는 이유는 그대로다. 바텀시트와
            확인창은 포털로 body 바로 아래에 붙는데, body가 flex 컨테이너이면서
            폭까지 제한하면 그 포털이 폭 계산에 끼어들어 뒤에 깔린 화면이 짜부라진다. */}
        <div className="mx-auto flex min-h-full w-full flex-col">
          <AppProviders>
            {/* 열려 있는 동안 새 알림을 토스트로. shared/providers는 entities를 못 써 여기 둔다(#395) */}
            <NewNotificationToaster />
            {children}
          </AppProviders>
        </div>
      </body>
    </html>
  );
}
