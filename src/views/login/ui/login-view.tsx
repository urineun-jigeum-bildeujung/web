// 로그인 화면. 아이디·비밀번호로 들어오거나 소셜로 들어온다.
// UI 시안 기준(sign_001 로그인, 1117-4927)이다.
//
// 시안에는 소셜이 넷(카카오·네이버·애플·구글) 그려져 있으나 인증 정책은 카카오·구글로
// 확정돼 둘만 둔다. 실제 인증은 백엔드 방식이 정해져야 붙는다.
//
// 소셜 로고는 디자인 시스템 아이콘 세트 밖이라 react-icons 브랜드 글리프를 쓴다.
// (RiKakaoTalkFill · FcGoogle)

"use client";

import Link from "next/link";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { RiKakaoTalkFill } from "react-icons/ri";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { FormField } from "@/shared/ui/form-field/form-field";

// 브랜드 색은 아이콘 자체가 들고 있어 배경에 HEX를 쓰지 않는다.
// 카카오는 노란 바탕에 검은 말풍선이라 원형 배경이 필요한데, 그 색만 토큰으로 뺐다
const SOCIALS = [
  {
    id: "kakao",
    label: "카카오로 시작하기",
    icon: <RiKakaoTalkFill aria-hidden className="size-6 text-black" />,
    className: "bg-kakao",
  },
  {
    id: "google",
    label: "구글로 시작하기",
    icon: <FcGoogle aria-hidden className="size-4.5" />,
    className: "border border-border-default bg-background",
  },
] as const;

export function LoginView() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(true);

  const canSubmit = loginId.trim().length > 0 && password.length > 0;

  return (
    <div className="flex min-h-dvh flex-col px-5 pt-15">
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

      <form
        className="flex flex-col pt-13"
        onSubmit={(event) => {
          event.preventDefault();
          // 백엔드 인증 방식 확정 전이라 아직 보내지 않는다
        }}
      >
        {/* 시안은 레이블과 입력 사이가 4px이다. 온보딩(12px)보다 좁다 */}
        <FormField
          label="아이디"
          className="gap-1"
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          autoComplete="username"
        />
        <FormField
          label="비밀번호"
          className="gap-1 pt-4"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />

        {/* 시안은 입력·체크·버튼 사이가 12px씩이다. 체크 줄은 탭 영역 44px 안에 24px 원이
            가운데 있어 위아래 10px이 이미 들어 있으므로 2px만 더한다 */}
        <div className="flex flex-col gap-0.5 pt-0.5">
          <CheckboxRow
            label="자동로그인"
            checked={autoLogin}
            onCheckedChange={setAutoLogin}
            className="[&>label]:text-body-regular-14"
          />

          {/* 시안의 button/xl. 비활성은 흐려지지 않고 회색으로 채워진다 */}
          <Button
            type="submit"
            className="h-11 text-label-bold-16 disabled:bg-surface-disable disabled:text-text-label-disable disabled:opacity-100"
            disabled={!canSubmit}
          >
            로그인
          </Button>
        </div>
      </form>

      {/* 아이디·비밀번호 찾기는 갈 화면이 아직 시안에 없다. 링크를 걸면 404가 되고
          버튼으로 두면 눌러도 아무 일이 없어 고장으로 읽힌다 — ListRowStatic과 같은 판단이다 */}
      <p className="flex items-center justify-center gap-2 pt-5 text-body-medium-14 text-foreground">
        <span className="flex min-h-11 w-20 items-center justify-center">아이디 찾기</span>
        <span aria-hidden className="h-3 w-px bg-border-default" />
        <span className="flex min-h-11 w-20 items-center justify-center">비밀번호 찾기</span>
        <span aria-hidden className="h-3 w-px bg-border-default" />
        <Link href="/signup" className="flex min-h-11 w-20 items-center justify-center">
          회원가입
        </Link>
      </p>

      <div className="flex items-center justify-center gap-10 pt-15 pb-10">
        {SOCIALS.map((social) => (
          <button
            key={social.id}
            type="button"
            aria-label={social.label}
            className={cn(
              "flex size-11 items-center justify-center rounded-full",
              "transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              social.className,
            )}
          >
            {social.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
