// 리뷰 작성 화면. 별점과 함께 아이의 실제 반응을 받는다.
// 와이어프레임 기준(리뷰 작성_기본 상태, 사용 기간 직접 수정 1·2, 기본 상태 활성화,
// 사진 3개 다 채울때, 리뷰 등록 완료)이라 디자인 확정 시 바뀔 수 있다.
//
// 이 화면이 이 서비스의 입력단이다. 기호성·배변·급여 편의성은 보호자가 그동안
// 혼자 추측하던 신호이고, 여기서 모인 것이 다음 추천의 근거가 된다.
// 어느 아이가 먹었는지를 함께 받는 것도 같은 이유다 — 아이를 모르면 쓸 수 없는 답이다.

"use client";

import Link from "next/link";
import { useState } from "react";
import { IoCheckmarkCircle } from "react-icons/io5";

import { PetSwitcher, type PetSummary } from "@/entities/pet";
import { withJosa } from "@/shared/lib/josa/josa";
import { Button } from "@/shared/ui/button";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";
import { Textarea } from "@/shared/ui/textarea";

import { PhotoPicker } from "./photo-picker";
import { RatingInput } from "./rating-input";

type ReviewWriteViewProps = {
  /** 리뷰를 달 구매 항목의 임시 식별자. API 계약 확정 전까지 쓴다 */
  orderItemId: string | undefined;
};

/** 아이가 어떻게 반응했는지. 별점만으로는 알 수 없는 것들이다 */
const RESPONSES = [
  {
    key: "taste",
    label: "기호성 — 잘 먹었나요?",
    options: [
      { value: "bad", label: "안 먹어요" },
      { value: "soso", label: "보통이에요" },
      { value: "good", label: "잘 먹어요" },
    ],
  },
  {
    key: "stool",
    label: "소화 반응 — 아이 배변 상태는 어땠나요?",
    options: [
      { value: "bad", label: "나빠졌어요" },
      { value: "soso", label: "그대로예요" },
      { value: "good", label: "좋아졌어요" },
    ],
  },
  {
    key: "handling",
    label: "급여 편의성(정제 크기 등) — 아이에게 급여하기 편했나요?",
    options: [
      { value: "bad", label: "불편해요" },
      { value: "soso", label: "보통이에요" },
      { value: "good", label: "편해요" },
    ],
  },
] as const;

const PETS: PetSummary[] = [
  { id: "p1", name: "소리" },
  { id: "p2", name: "냥냥이" },
];

const MIN_TEXT = 10;
const MAX_TEXT = 300;

// 목 데이터. 실제로는 orderItemId로 무엇을 샀는지 받아온다
const PRODUCT = {
  name: "면역 지원 영양제 90정",
  option: "[옵션] 90정 1병",
  repurchase: "재구매 2회",
};

export function ReviewWriteView({ orderItemId }: ReviewWriteViewProps) {
  const [score, setScore] = useState(0);
  const [days, setDays] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [petId, setPetId] = useState<string>();
  const [photos, setPhotos] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  // 사진은 선택이다. 나머지는 없으면 다음 추천에 쓸 수 없어 받아야 한다
  const ready =
    score > 0 &&
    days.length > 0 &&
    RESPONSES.every((item) => responses[item.key]) &&
    petId !== undefined &&
    text.trim().length >= MIN_TEXT;

  if (done) {
    const pet = PETS.find((item) => item.id === petId);

    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader title="리뷰 작성" leading="none" />

        <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <IoCheckmarkCircle aria-hidden className="size-12 text-brand" />
          <h1 className="text-base font-semibold text-foreground">소중한 리뷰 감사해요!</h1>
          <p className="text-sm text-balance text-muted-foreground">
            {pet ? `${withJosa(pet.name, "이/가")} 어땠는지 남겨주신 후기가` : "남겨주신 후기가"}
            <br />
            다른 보호자들에게 큰 도움이 될 거예요
          </p>
        </main>

        <div className="p-4">
          <Button asChild className="min-h-12 w-full">
            <Link href="/mypage/reviews">확인</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="리뷰 작성" />

      <main className="flex flex-1 flex-col gap-6 px-4 pb-8">
        <ProductSummary
          name={PRODUCT.name}
          imageSize={16}
          nameTrailing={
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {PRODUCT.repurchase}
            </span>
          }
          meta={PRODUCT.option}
        />

        <section className="flex flex-col gap-2">
          <h2 className="text-center text-sm font-medium text-foreground">
            상품은 만족스러우셨나요?
          </h2>
          <RatingInput value={score} onChange={setScore} label="상품 만족도" />
        </section>

        <section className="flex flex-col gap-2">
          <Label htmlFor="review-days" className="text-sm font-medium">
            사용 기간
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="review-days"
              // 숫자만 받는 칸이라 모바일에서 숫자 키패드가 뜨게 한다
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              value={days}
              onChange={(event) => setDays(event.target.value.replace(/\D/g, ""))}
              className="w-16 text-center"
            />
            <span className="text-sm text-muted-foreground">일째 사용 중</span>
          </div>
        </section>

        {RESPONSES.map((item) => (
          <section key={item.key} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">{item.label}</h2>
            <ChipSelect
              label={item.label}
              options={[...item.options]}
              // 처음부터 controlled로 잡는다. undefined로 시작하면 고르는 순간
              // uncontrolled에서 controlled로 바뀌었다고 Radix가 경고한다
              value={responses[item.key] ?? ""}
              onValueChange={(value) => setResponses((prev) => ({ ...prev, [item.key]: value }))}
            />
          </section>
        ))}

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground">사용 반려동물 프로필 선택</h2>
          <PetSwitcher pets={PETS} selectedId={petId} onSelect={setPetId} withNames />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground">
            사진 첨부
            <span className="ml-1 text-xs font-normal text-muted-foreground">(선택, 최대 3장)</span>
          </h2>
          <PhotoPicker files={photos} onChange={setPhotos} />
        </section>

        <section className="flex flex-col gap-1">
          <Label htmlFor="review-text" className="sr-only">
            다른 보호자에게 도움이 되는 후기
          </Label>
          <Textarea
            id="review-text"
            rows={4}
            maxLength={MAX_TEXT}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={`다른 보호자에게 도움이 되는 후기를 남겨주세요 (최소 ${MIN_TEXT}자)`}
          />
          <p className="text-right text-xs text-muted-foreground">
            {text.length}/{MAX_TEXT}
          </p>
        </section>

        <Button
          className="min-h-12"
          disabled={!ready}
          onClick={() => {
            // API 계약 확정 전이라 보내지 않고 화면만 넘어간다
            void orderItemId;
            setDone(true);
          }}
        >
          리뷰 등록하기
        </Button>
      </main>
    </div>
  );
}
