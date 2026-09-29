// 배송 요청사항. 보기 목록에서 고르고, "직접 입력"을 고르면 아래에 적는 칸이 열린다.
// UI 페이지 시안 기준(paym_001_드롭다운 1586:24254, paym_001_직접입력)이다.
//
// **결제 화면과 배송지 등록·수정이 함께 쓴다** (QA No.174, #526). 배송지 폼에는 적는 칸 하나만
// 있어 보기를 고를 수 없었다. 둘 다 `views/`라 한쪽에 두면 다른 쪽이 못 본다.
//
// 라벨은 화면마다 글자와 모양이 달라 부르는 쪽이 그리고 `id`로 잇는다.

"use client";

import { useId, useState } from "react";

import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

import {
  clampDeliveryNote,
  DELIVERY_NOTE_DIRECT,
  DELIVERY_NOTE_MAX,
  DELIVERY_NOTE_OPTIONS,
  isDirectDeliveryNote,
} from "../model/delivery-note";

type DeliveryNoteFieldProps = {
  /** 보기 상자의 id. 부르는 쪽 라벨의 `htmlFor`가 가리킨다 */
  id: string;
  /** 보낼 요청사항. 고른 보기의 문구이거나 직접 적은 글이다. 비었으면 아직 고른 것이 없다 */
  value: string;
  onChange: (value: string) => void;
};

export function DeliveryNoteField({ id, value, onChange }: DeliveryNoteFieldProps) {
  const directId = useId();
  // **"직접 입력"을 골랐는지는 값만으로 가를 수 없다.** 고른 직후는 빈 값이고, 적는 글이 보기
  // 문구와 같아질 수도 있다. 그 순간 칸이 닫히면 적던 것이 손 밑에서 사라진다.
  const [directChosen, setDirectChosen] = useState(false);
  // 저장해 둔 글이 목록에 없으면 직접 적은 것이다 — 열 때부터 칸을 열어 그 글을 보인다
  const direct = directChosen || isDirectDeliveryNote(value);
  const option = direct ? DELIVERY_NOTE_DIRECT : value;

  const choose = (next: string) => {
    const isDirect = next === DELIVERY_NOTE_DIRECT;
    setDirectChosen(isDirect);
    // 직접 입력은 빈 칸에서 시작한다. 고른 보기 문구가 칸에 남으면 지우고 적어야 한다
    onChange(isDirect ? "" : next);
  };

  return (
    <>
      <Select value={option} onValueChange={choose}>
        {/* 시안이 44px 박스에 20px 화살표를 둔다. shadcn이 `data-[size=default]:h-8`로
            높이를 못박아 같은 속성으로는 덮이지 않으므로 최소 높이로 올린다 */}
        <SelectTrigger
          id={id}
          className="min-h-11 w-full rounded-lg px-3 text-body-medium-14 text-foreground data-placeholder:text-text-body-tertiary [&_svg]:size-5"
        >
          {/* 상자에는 "[기본]" 없이 원래 문구를 보인다. 비워 두면 고른 보기의 글자를 그대로 옮긴다.
              고른 것이 없으면(배송지에 요청사항이 없을 때) 안내 글자가 뜬다 */}
          <SelectValue placeholder="요청사항을 선택해주세요">{option}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {DELIVERY_NOTE_OPTIONS.map((item, index) => (
            <SelectItem key={item} value={item}>
              {index === 0 ? `[기본] ${item}` : item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 직접 입력을 고른 뒤에만 칸이 열린다(paym_001_직접입력) */}
      {direct && (
        <div className="flex flex-col gap-1">
          <Label htmlFor={directId} className="sr-only">
            배송 요청사항 직접 입력
          </Label>
          <Textarea
            id={directId}
            placeholder={`배송 요청사항을 작성해주세요 (최대 ${DELIVERY_NOTE_MAX}자)`}
            maxLength={DELIVERY_NOTE_MAX}
            value={value}
            // **`maxLength`만으로는 한글이 한 자 넘친다.** 조합 중인 글자는 길이 제한을 거치지 않아
            // 101자째가 그대로 들어오고, 배송지 폼은 그 값을 검증에서 막아 입력 완료가 꺼진 채 남았다.
            // 넘친 값을 받지 않도록 여기서 한 번 더 자른다 (QA No.175)
            onChange={(event) => onChange(clampDeliveryNote(event.target.value))}
            className="min-h-24"
          />
          <p className="self-end text-caption-regular-12 text-text-body-secondary">
            {value.length}/{DELIVERY_NOTE_MAX}자
          </p>
        </div>
      )}
    </>
  );
}
