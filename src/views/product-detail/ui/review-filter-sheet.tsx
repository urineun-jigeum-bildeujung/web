// 리뷰 필터 바텀시트. 조건을 직접 골라 후기를 좁힌다.
// 와이어프레임 기준(상품 상세_리뷰 필터 바텀시트_1~_4)이라 디자인 확정 시 바뀔 수 있다.
//
// 리뷰가 128개면 그중 우리 아이와 비슷한 조건의 후기만 골라 읽어야 판단이 된다.
// 4kg 말티즈 보호자에게 28kg 리트리버의 후기는 참고가 되지 않는다.
//
// 고르는 동안에는 화면 안 상태로 들고, 적용을 눌러야 바깥으로 넘긴다. 슬라이더를
// 움직일 때마다 목록이 바뀌면 무엇을 고르는 중인지 알 수 없다.

"use client";

import { useId, useState } from "react";

import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { Slider } from "@/shared/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import {
  AGE_RANGE,
  DEFAULT_FILTER,
  PERIOD_RANGE,
  WEIGHT_RANGE,
  ageLabel,
  periodLabel,
  weightLabel,
  type Neutered,
  type ReviewFilter,
  type Species,
} from "../model/review-filter";

type ReviewFilterSheetProps = {
  filter: ReviewFilter;
  onApply: (filter: ReviewFilter) => void;
  /** 지금 조건으로 걸러지는 후기 수를 미리 세어 버튼에 적는다 */
  countOf: (filter: ReviewFilter) => number;
};

/** 슬라이더 끝 눈금. 오른쪽 끝은 "그 이상"이라 +를 붙인다 */
function Ticks({ labels }: { labels: string[] }) {
  return (
    <div aria-hidden className="flex justify-between text-xs text-muted-foreground">
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
}

/**
 * 조건 한 칸.
 *
 * radix Slider는 실제 `role="slider"`가 Thumb에 붙고 그 이름이 "Minimum"·"Maximum"으로
 * 고정된다. Root에 `aria-label`을 줘도 Thumb까지 닿지 않아, 제목과 묶은 group으로
 * 감싸 무엇을 고르는 중인지 함께 읽히게 한다. shadcn 생성 파일은 건드리지 않는다.
 */
function Field({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();

  return (
    <section className="flex flex-col gap-2 border-b border-border p-4">
      <h3 id={id} className="text-sm font-medium text-foreground">
        {title}
      </h3>
      <div role="group" aria-labelledby={id} className="flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}

/** 고른 구간이 무엇을 뜻하는지. 고르지 않았으면 나오지 않는다 */
function Summary({ text }: { text: string | null }) {
  if (!text) return null;
  return <p className="text-xs font-medium text-primary">{text}</p>;
}

export function ReviewFilterSheet({ filter, onApply, countOf }: ReviewFilterSheetProps) {
  const [open, setOpen] = useState(false);
  // 시트를 열 때마다 바깥 값에서 다시 시작한다. 닫고 다시 열면 적용된 조건이 보여야 한다
  const [draft, setDraft] = useState(filter);

  const openSheet = (next: boolean) => {
    if (next) setDraft(filter);
    setOpen(next);
  };

  const patch = (part: Partial<ReviewFilter>) => setDraft((prev) => ({ ...prev, ...part }));

  return (
    <Drawer open={open} onOpenChange={openSheet}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="min-h-11 rounded-full">
          기본 맞춤 필터
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85dvh]">
        <DrawerTitle className="sr-only">리뷰 거르기</DrawerTitle>
        <DrawerDescription className="sr-only">
          사용 기간과 반려동물 조건으로 후기를 좁힙니다
        </DrawerDescription>

        <Tabs defaultValue="type" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="type" className="min-h-11 flex-1">
              리뷰 유형
            </TabsTrigger>
            <TabsTrigger value="pet" className="min-h-11 flex-1">
              반려동물 필터
            </TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <TabsContent value="type">
              <Field title="사용 기간">
                <Slider
                  min={PERIOD_RANGE[0]}
                  max={PERIOD_RANGE[1]}
                  step={1}
                  value={draft.period}
                  onValueChange={([min, max]) => patch({ period: [min, max] })}
                />
                <Ticks labels={["1개월", "3개월", "6개월", "9개월+"]} />
                <Summary text={periodLabel(draft)} />
              </Field>

              <div className="px-4 py-2">
                <CheckboxRow
                  label="재구매 여부만 보기"
                  checked={draft.repeatOnly}
                  onCheckedChange={(checked) => patch({ repeatOnly: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="pet">
              <Field title="종">
                <ChipSelect
                  label="종"
                  options={[
                    { value: "dog", label: "강아지" },
                    { value: "cat", label: "고양이" },
                  ]}
                  value={draft.species ?? ""}
                  onValueChange={(value) => patch({ species: value as Species })}
                  columns={2}
                  className="w-40"
                />
              </Field>

              <Field title="나이">
                <Slider
                  min={AGE_RANGE[0]}
                  max={AGE_RANGE[1]}
                  step={1}
                  value={draft.age}
                  onValueChange={([min, max]) => patch({ age: [min, max] })}
                />
                <Ticks labels={["0세", "15세+"]} />
                <Summary text={ageLabel(draft)} />
              </Field>

              <Field title="중성화 여부">
                <ChipSelect
                  label="중성화 여부"
                  options={[
                    { value: "yes", label: "중성화 O" },
                    { value: "no", label: "중성화 X" },
                  ]}
                  value={draft.neutered ?? ""}
                  onValueChange={(value) => patch({ neutered: value as Neutered })}
                  columns={2}
                  className="w-48"
                />
              </Field>

              <Field title="체중">
                <Slider
                  min={WEIGHT_RANGE[0]}
                  max={WEIGHT_RANGE[1]}
                  step={1}
                  value={draft.weight}
                  onValueChange={([min, max]) => patch({ weight: [min, max] })}
                />
                <Ticks labels={["1kg", "30kg+"]} />
                <Summary text={weightLabel(draft)} />
              </Field>

              {/* 품종과 건강 관심사는 고를 것이 많아 전체화면으로 나간다. #150에서 이 자리에 붙는다 */}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex gap-2 border-t border-border p-4">
          <Button variant="outline" className="min-h-11" onClick={() => setDraft(DEFAULT_FILTER)}>
            초기화
          </Button>
          <Button
            className="min-h-11 flex-1"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            리뷰 {countOf(draft)}개 보기
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
