// 주문번호를 복사하는 버튼. 승인이 끝나지 않았을 때 문의에 붙일 번호를 옮겨 준다.
//
// **이 조각만 클라이언트 컴포넌트다.** 완료 화면은 서버 컴포넌트로 두고, 클립보드를 쓰는
// 이 자리만 갈랐다. 화면 꼭대기에 `use client`를 붙이면 아래 전부가 클라이언트 번들로 내려간다.
//
// **복사 글리프가 디자인 시스템 icon 51종에 없어 react-icons로 채운다** (AGENTS.md 5.3).
// 완료 표시는 세트의 `check`를 쓴다. PD팀에 추가를 요청할 후보다.

"use client";

import { useState } from "react";

import { IoCopyOutline } from "react-icons/io5";

import { Icon } from "@/shared/ui/icon/icon";

type CopyOrderNumberProps = {
  orderNumber: string;
};

/** 복사했다는 표시를 얼마나 남길지. 짧으면 못 보고 길면 다음 동작을 가린다 */
const DONE_MS = 2000;

export function CopyOrderNumber({ orderNumber }: CopyOrderNumberProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), DONE_MS);
    } catch {
      // **실패해도 알리지 않는다.** 클립보드는 권한이나 보안 맥락 때문에 막히는데
      // 사용자가 할 수 있는 일이 없다. 번호는 화면에 그대로 있어 직접 고를 수 있다
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={`주문번호 ${orderNumber} 복사`}
      className="flex min-h-11 items-center gap-1 rounded-md px-2 text-label-medium-12 text-text-body-secondary transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {copied ? <Icon name="check" className="size-4" /> : <IoCopyOutline className="size-4" />}
      {copied ? "복사됨" : "복사"}
    </button>
  );
}
