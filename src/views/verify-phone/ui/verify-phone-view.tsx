// 휴대폰 번호 인증. 통신사를 고르고 번호를 받아 인증번호로 확인한다.
// 와이어프레임 기준(mypa_212, 통신사선택, 번호입력, 인증, 완료)이라 디자인 확정 시 바뀔 수 있다.
//
// 인증 수단이 아직 정해지지 않았다. 화면과 흐름만 만들고 실제 발송은 붙이지 않는다.
// 시안의 통신사 선택은 본인확인 서비스 형태인데, 그것은 사업자등록이 필요하고 건당 과금이다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

const CARRIERS = ["SKT", "KT", "LG U+", "SKT 알뜰폰", "KT 알뜰폰", "LG U+ 알뜰폰"];

export function VerifyPhoneView() {
  const router = useRouter();
  const [carrier, setCarrier] = useState<string>();
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);

  const canRequestCode = Boolean(carrier) && phone.replace(/\D/g, "").length >= 10;

  return (
    <SingleInputScreen
      question="연락받으실 번호를 알려주세요"
      submitDisabled={!verified}
      onSubmit={() => router.back()}
    >
      <Select value={carrier} onValueChange={setCarrier}>
        <SelectTrigger className="min-h-11 w-full" aria-label="통신사">
          <SelectValue placeholder="통신사 선택" />
        </SelectTrigger>
        <SelectContent>
          {CARRIERS.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-start gap-2">
        <FormField
          label="휴대폰 번호"
          className="flex-1 [&>label]:sr-only"
          placeholder="010-1234-5678"
          inputMode="numeric"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <Button
          variant="outline"
          className="min-h-11 shrink-0"
          disabled={!canRequestCode}
          onClick={() => setCodeSent(true)}
        >
          인증
        </Button>
      </div>

      {codeSent && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">인증 번호를 입력해주세요</p>
          <div className="flex items-start gap-2">
            <FormField
              label="인증 번호"
              className="flex-1 [&>label]:sr-only"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <Button
              className="min-h-11 shrink-0"
              disabled={code.length < 4 || verified}
              onClick={() => setVerified(true)}
            >
              확인
            </Button>
          </div>
          {verified && <p className="text-xs text-muted-foreground">인증이 완료됐어요.</p>}
        </div>
      )}
    </SingleInputScreen>
  );
}
