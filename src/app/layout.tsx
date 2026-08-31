// 루트 레이아웃. 폰트 변수와 전역 스타일을 걸고 AppProviders로 감싼다.

import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/shared/lib/utils";
import { AppProviders } from "@/shared/providers/app-providers";

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });

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
      className={cn("h-full", "antialiased", geistMono.variable, "font-sans", notoSans.variable)}
    >
      {/* 지금은 모바일 시안만 있어 화면 폭을 여기서 한 번에 제한한다.
          화면마다 붙이면 새 화면에서 빠뜨리게 되고 실제로 그렇게 됐다.
          태블릿·데스크톱 시안이 나오면 이 제한을 풀고 화면별로 정한다. */}
      <body className="mx-auto flex min-h-full w-full max-w-105 flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
