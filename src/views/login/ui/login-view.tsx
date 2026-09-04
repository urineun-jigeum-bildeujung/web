// 로그인 화면. 아이디·비밀번호로 들어오거나 소셜로 들어온다.
// 와이어프레임 기준(sign_001)이라 디자인 확정 시 바뀔 수 있다.
//
// 시안에는 소셜이 넷 그려져 있고 "MVP는 카카오·네이버"라는 메모가 붙어 있으나,
// 카카오·구글로 확정돼 둘만 둔다. 실제 인증은 백엔드 방식이 정해져야 붙는다.

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
    icon: <FcGoogle aria-hidden className="size-6" />,
    className: "border border-border bg-background",
  },
] as const;

export function LoginView() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(true);

  const canSubmit = loginId.trim().length > 0 && password.length > 0;

  return (
    <div className="flex min-h-dvh flex-col px-4">
      <header className="pt-16 pb-10">
        <h1 className="text-2xl font-bold text-foreground">
          우리 아이 맞춤 사료
          <br />
          <span className="text-brand">골라주개냥</span>
        </h1>
        <p className="pt-3 text-sm text-muted-foreground">
          나이, 몸무게, 고민 알려주세요.
          <br />
          고민은 저희가 할게요.
        </p>
      </header>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          // 백엔드 인증 방식 확정 전이라 아직 보내지 않는다
        }}
      >
        <FormField
          label="아이디"
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          autoComplete="username"
        />
        <FormField
          label="비밀번호"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />

        <CheckboxRow label="자동로그인" checked={autoLogin} onCheckedChange={setAutoLogin} />

        <Button type="submit" className="min-h-12" disabled={!canSubmit}>
          로그인
        </Button>
      </form>

      {/* 아이디·비밀번호 찾기는 갈 화면이 아직 시안에 없다. 링크를 걸면 404가 되고
          버튼으로 두면 눌러도 아무 일이 없어 고장으로 읽힌다 — ListRowStatic과 같은 판단이다 */}
      <p className="flex items-center justify-center pt-4 text-xs text-muted-foreground">
        <span className="flex min-h-11 items-center px-3">아이디 찾기</span>
        <span aria-hidden className="text-border">
          |
        </span>
        <span className="flex min-h-11 items-center px-3">비밀번호 찾기</span>
        <span aria-hidden className="text-border">
          |
        </span>
        <Link
          href="/signup"
          className="flex min-h-11 items-center px-3 font-medium text-foreground"
        >
          회원가입
        </Link>
      </p>

      <div className="flex flex-col gap-2 py-8">
        {SOCIALS.map((social) => (
          <button
            key={social.id}
            type="button"
            className={cn(
              "flex min-h-12 items-center justify-center gap-2 rounded-lg text-sm font-medium text-foreground",
              "transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              social.className,
            )}
          >
            {social.icon}
            {social.label}
          </button>
        ))}
      </div>
    </div>
  );
}
