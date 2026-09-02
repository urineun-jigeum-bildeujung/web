// 휴대폰 번호 인증. 통신사를 고르고 번호를 받아 인증번호로 확인한다.
// 와이어프레임 기준(mypa_212, 통신사선택, 번호입력, 인증, 완료)이라 디자인 확정 시 바뀔 수 있다.
//
// MVP에서는 목업으로 간다. 인증을 누르면 번호가 채워지고 실제 문자는 가지 않는다.
// 문자 발송은 건당 과금이고 무료 지원은 사업자등록이 있어야 하는데 우리는 없다.
// 화면과 흐름은 그대로 두라는 것이 PM 방침이다 — 기능 명세에는 남기고 구현만 덜어낸다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

const CARRIERS = ["SKT", "KT", "LG U+", "SKT 알뜰폰", "KT 알뜰폰", "LG U+ 알뜰폰"];

/** 문자가 가지 않으므로 받은 것처럼 채워 넣는 값. 시안(`mypa_212`)에 적힌 번호다. */
const MOCK_CODE = "45621";

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
          onClick={() => {
            setCodeSent(true);
            // 문자가 가지 않으니 받은 것처럼 채워 준다
            setCode(MOCK_CODE);
          }}
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
