// 로그인 화면. 소셜(카카오·구글)로만 들어온다.
// UI 시안 기준(sign_001 로그인, 3574-80319)이다 (#463).
//
// 시안의 소셜은 카카오·네이버인데 인증 정책이 카카오·구글로 확정돼 네이버 자리에 구글을 둔다.
// 구글 버튼은 시안이 없어 구글 브랜드 가이드(흰 바탕·테두리)대로 카카오와 같은 모양으로 맞췄다.
//
// 카카오 로고는 시안 SVG이고, 구글 로고는 디자인 시스템 아이콘 세트 밖이라 react-icons 브랜드
// 글리프(FcGoogle)를 쓴다.

import Image from "next/image";
import { FcGoogle } from "react-icons/fc";

import { cn } from "@/shared/lib/utils";

import { socialLoginUrl } from "../config/oauth";

// 시안 글자는 15px SemiBold인데 맞는 토큰이 없어 다른 주요 버튼과 같은 label-bold-16을 쓴다.
// 카카오 글자는 다크 모드에서도 노란 바탕 위라 모드에 따라 바뀌지 않는 검정이다
const SOCIALS = [
  {
    id: "kakao",
    label: "카카오 로그인",
    icon: (
      // 18×18짜리 SVG라 최적화로 얻을 것이 없고 `/_next/image` 왕복만 는다(TossPayLogo와 같은 판단)
      <Image src="/images/login/kakao.svg" alt="" width={18} height={18} unoptimized />
    ),
    className: "bg-kakao text-text-label-static-black",
  },
  {
    id: "google",
    label: "구글 로그인",
    icon: <FcGoogle aria-hidden className="size-4.5" />,
    className: "border border-border-default bg-background text-foreground",
  },
] as const;

export function LoginView() {
  return (
    <div className="flex min-h-dvh flex-col px-5 pt-24">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-bold-24 text-foreground">
          우리 아이 맞춤 사료
          <br />
          골라주개냥
        </h1>
        <p className="text-body-medium-16 text-foreground">
          나이, 몸무게, 고민 질환만 알려주세요.
          <br />
          고민은 저희가 할게요.
        </p>
      </header>

      <div className="flex flex-col gap-4 pt-29">
        {SOCIALS.map((social) => (
          // 인증 제공자 화면으로 리다이렉트되는 흐름이라 fetch가 아니라 브라우저를 통째로
          // 보낸다. 이동이므로 button이 아니라 a다 — 새 탭·복사 같은 기본 동작도 따라온다.
          // Next Link는 앱 라우트용이라 쓰지 않는다
          <a
            key={social.id}
            href={socialLoginUrl(social.id)}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-md text-label-bold-16",
              "transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              social.className,
            )}
          >
            {social.icon}
            {social.label}
          </a>
        ))}
      </div>
    </div>
  );
}
