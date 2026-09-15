// 휴대폰 번호 인증. 통신사를 고르고 번호를 받아 인증번호로 확인한다.
// UI 시안 기준(mypa_212 다섯 장, 1500-38228~1500-38659)이다.
//
// MVP에서는 목업으로 간다. 인증을 누르면 번호가 채워지고 실제 문자는 가지 않는다.
// 문자 발송은 건당 과금이고 무료 지원은 사업자등록이 있어야 하는데 우리는 없다.
// 화면과 흐름은 그대로 두라는 것이 PM 방침이다 — 기능 명세에는 남기고 구현만 덜어낸다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppSuccess } from "@/shared/lib/app-toast";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

const CARRIERS = ["SKT", "KT", "LG U+", "SKT 알뜰폰", "KT 알뜰폰", "LG U+ 알뜰폰"];

/** 문자가 가지 않으므로 받은 것처럼 채워 넣는 값. 시안(`mypa_212`)에 적힌 번호다. */
const MOCK_CODE = "987654";

/** 입력칸 안 오른쪽의 32px 검정 칩. 시안의 action_button */
const CHIP_CLASS = "h-8 rounded-md px-2 text-label-medium-14";

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
        {/* 시안의 입력칸과 같은 44px 상자. 값이 차면 선이 진해진다 */}
        <SelectTrigger
          aria-label="통신사"
          className="min-h-11 w-full rounded-lg border-border-secondary px-3 text-body-medium-14 data-placeholder:border-border-default data-placeholder:text-text-body-tertiary"
        >
          <SelectValue placeholder="통신사 선택" />
        </SelectTrigger>
        <SelectContent>
          {CARRIERS.map((item) => (
            <SelectItem key={item} value={item} className="min-h-10 text-body-medium-14">
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <FormField
        label="휴대폰 번호"
        className="[&>label]:sr-only"
        placeholder="010-1234-5678"
        inputMode="numeric"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        trailing={
          <Button
            aria-label="인증 번호 받기"
            className={CHIP_CLASS}
            disabled={!canRequestCode}
            onClick={() => {
              setCodeSent(true);
              // 문자가 가지 않으니 받은 것처럼 채워 주고, 보낸 것처럼 알린다
              setCode(MOCK_CODE);
              toastAppSuccess(APP_MESSAGE_CODE.member.verificationCodeSent);
            }}
          >
            인증
          </Button>
        }
      />

      {codeSent && (
        <div className="flex flex-col gap-4 pt-2">
          <h2 className="text-title-bold-20 text-foreground">인증 번호를 입력해주세요</h2>
          <FormField
            label="인증 번호"
            className="[&>label]:sr-only"
            inputMode="numeric"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            trailing={
              <Button
                aria-label="인증 번호 확인"
                className={CHIP_CLASS}
                disabled={code.length < 4 || verified}
                onClick={() => setVerified(true)}
              >
                인증
              </Button>
            }
          />
        </div>
      )}
    </SingleInputScreen>
  );
}
