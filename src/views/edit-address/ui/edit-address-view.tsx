// 배송지 추가·수정. 이름과 주소, 요청사항을 받는다.
// 와이어프레임 기준(mypa_311_미입력, mypa_311)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IoChevronForward } from "react-icons/io5";

import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { FormField } from "@/shared/ui/form-field/form-field";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

export function EditAddressView() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  // 주소 검색 화면에서 고른 값을 받아 채운다. 화면 간 전달 방식은
  // 라우터 구조가 정해진 뒤에 붙인다.
  const [address] = useState("");
  const [detail, setDetail] = useState("");
  const [request, setRequest] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  return (
    <SingleInputScreen
      question="어디로 보내드릴까요?"
      submitDisabled={!label.trim() || !address.trim()}
      onSubmit={() => router.back()}
    >
      <FormField
        label="배송지 이름"
        hint="ex) 집, 회사"
        placeholder="집"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        onClear={() => setLabel("")}
      />

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">받을 곳 주소</p>
        {/* 주소는 검색 화면에서 고른다 */}
        <Link
          href="/mypage/address/search"
          className="flex min-h-11 items-center justify-between rounded-lg border border-input px-3 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className={address ? "text-foreground" : "text-muted-foreground"}>
            {address || "주소 검색"}
          </span>
          <IoChevronForward aria-hidden className="size-4 text-muted-foreground" />
        </Link>
        <FormField
          label="상세 주소"
          className="[&>label]:sr-only"
          placeholder="상세주소를 입력해 주세요"
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
        />
      </div>

      <FormField
        label="배송 요청사항"
        placeholder="요청사항을 적어주세요"
        value={request}
        onChange={(event) => setRequest(event.target.value)}
        onClear={() => setRequest("")}
      />

      <CheckboxRow label="이 주소로 받을게요" checked={isDefault} onCheckedChange={setIsDefault} />
    </SingleInputScreen>
  );
}
