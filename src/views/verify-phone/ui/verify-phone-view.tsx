// 휴대폰 번호 인증. 통신사를 고르고 번호를 받아 인증번호로 확인한다.
// UI 시안 기준(mypa_212 다섯 장, 1500-38228~1500-38659)이다.
//
// 문자는 가지 않는다. 발송이 건당 과금이고 무료 지원은 사업자등록이 있어야 하는데 우리는 없다.
// 화면과 흐름은 그대로 두라는 것이 PM 방침이다 — 기능 명세에는 남기고 발송만 덜어낸다.
//
// **서버도 같은 방침이라 인증번호가 `584937`로 고정돼 있다.** 그래서 받은 것처럼 채워
// 주되, 발송·확인은 실제 API를 탄다(#247) — 만료 180초와 재시도 제한이 그쪽에 있다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError, toastAppSuccess } from "@/shared/lib/app-toast";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

import { useMutatePhoneVerification } from "../api/use-mutate-phone-verification";

const CARRIERS = ["SKT", "KT", "LG U+", "SKT 알뜰폰", "KT 알뜰폰", "LG U+ 알뜰폰"];

/**
 * 문자가 가지 않으므로 받은 것처럼 채워 넣는 값.
 *
 * **서버에 고정된 값(`FIXED_CODE`)과 같아야 확인이 통과한다.** 숨길 값이 아니라 양쪽이
 * 같은 상수를 쓰는 것이다. 실제 발송이 붙으면 이 자동 채움만 걷어낸다.
 */
const FIXED_CODE = "584937";

/** 입력칸 안 오른쪽의 32px 검정 칩. 시안의 action_button */
const CHIP_CLASS = "h-8 rounded-md px-2 text-label-medium-14";

export function VerifyPhoneView() {
  const router = useRouter();
  const [carrier, setCarrier] = useState<string>();
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);

  const { requestCode, isRequesting, confirmCode, isConfirming } = useMutatePhoneVerification();

  const canRequestCode = Boolean(carrier) && phone.replace(/\D/g, "").length >= 10;

  const sendCode = () => {
    requestCode(phone)
      .then(() => {
        setCodeSent(true);
        // 문자가 가지 않으니 받은 것처럼 채워 주고, 보낸 것처럼 알린다
        setCode(FIXED_CODE);
        toastAppSuccess(APP_MESSAGE_CODE.member.verificationCodeSent);
      })
      .catch((error: unknown) => toastAppError(toAppMessageCode(error), error));
  };

  const checkCode = () => {
    confirmCode({ phone, code })
      .then((ok) => {
        setVerified(ok);
        // 서버가 200에 `verified: false`로 답한다. 틀렸다는 것을 알려야 다시 칠 수 있다
        if (!ok) {
          toastAppError(APP_MESSAGE_CODE.member.verificationCodeWrong);
        }
      })
      .catch((error: unknown) => toastAppError(toAppMessageCode(error), error));
  };

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
            disabled={!canRequestCode || isRequesting}
            onClick={sendCode}
          >
            <LoadingSwap loading={isRequesting} label="인증 번호를 보내는 중">
              인증
            </LoadingSwap>
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
                disabled={code.length < 4 || verified || isConfirming}
                onClick={checkCode}
              >
                <LoadingSwap loading={isConfirming} label="인증 번호를 확인하는 중">
                  인증
                </LoadingSwap>
              </Button>
            }
          />
        </div>
      )}
    </SingleInputScreen>
  );
}
