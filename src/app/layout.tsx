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
    <html
      lang="ko"
      className={cn("h-full", "antialiased", geistMono.variable, "font-sans", pretendard.variable)}
    >
      <body className="min-h-full">
        {/* 지금은 모바일 시안만 있어 화면 폭을 여기서 한 번에 제한한다.
            화면마다 붙이면 새 화면에서 빠뜨리게 되고 실제로 그렇게 됐다.
            태블릿·데스크톱 시안이 나오면 이 제한을 풀고 화면별로 정한다.

            제한을 body가 아니라 이 div가 지는 이유가 있다. 바텀시트와 확인창은
            포털로 body 바로 아래에 붙는데, body가 flex 컨테이너이면서 폭까지
            제한하면 그 포털이 폭 계산에 끼어들어 뒤에 깔린 화면이 짜부라진다. */}
        <div className="mx-auto flex min-h-full w-full max-w-105 flex-col">
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
