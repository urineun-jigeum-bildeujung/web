// 공용 컴포넌트를 한 화면에 늘어놓고 눈으로 확인하는 개발용 화면.
// 디자인 확정 전까지 시안과 대조하는 용도이며 서비스 화면이 아니다.

"use client";

import { useState } from "react";
import {
  IoCartOutline,
  IoHeartOutline,
  IoNotificationsOutline,
  IoReceiptOutline,
  IoSearchOutline,
} from "react-icons/io5";

import { MatchScoreBadge } from "@/entities/product";
import { AvatarUploader } from "@/shared/ui/avatar-uploader/avatar-uploader";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { DefinitionRow } from "@/shared/ui/definition-row/definition-row";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { ErrorBoundary } from "@/shared/ui/error-boundary/error-boundary";
import { FormField } from "@/shared/ui/form-field/form-field";
import { ListRowButton, ListRowLink } from "@/shared/ui/list-row/list-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Price } from "@/shared/ui/price/price";
import { SettingGroup } from "@/shared/ui/setting-group/setting-group";
import { Skeleton } from "@/shared/ui/skeleton";
import { StepProgress } from "@/shared/ui/step-progress/step-progress";

const GENDER = [
  { value: "male", label: "남자아이" },
  { value: "female", label: "여자아이" },
];

const SIZE = [
  { value: "small", label: "소형견", description: "10kg 미만" },
  { value: "medium", label: "중형견", description: "10kg ~ 25kg" },
  { value: "large", label: "대형견", description: "25kg 이상" },
];

// 서버 렌더 중에 던지면 페이지 전체가 500이 되므로 눌렀을 때만 터뜨린다.
function BoomTrigger() {
  const [boom, setBoom] = useState(false);
  if (boom) throw new Error("확인용 오류");

  return (
    <Button variant="outline" onClick={() => setBoom(true)}>
      오류 내보기
    </Button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-border px-4 py-5">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DevGalleryView() {
  const [name, setName] = useState("코코");
  const [gender, setGender] = useState<string>();
  const [size, setSize] = useState<string>("small");
  const [noAllergy, setNoAllergy] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col border-x border-border">
      <PageHeader
        title="공용 컴포넌트"
        leading="none"
        right={
          <>
            <button
              type="button"
              aria-label="장바구니"
              className="flex size-11 items-center justify-center"
            >
              <IoCartOutline aria-hidden className="size-6" />
            </button>
            <button
              type="button"
              aria-label="알림"
              className="flex size-11 items-center justify-center"
            >
              <IoNotificationsOutline aria-hidden className="size-6" />
            </button>
          </>
        }
      />

      <main className="flex-1">
        <Section title="StepProgress">
          <StepProgress total={4} current={2} />
        </Section>

        <Section title="AvatarUploader">
          <AvatarUploader onFileChange={() => {}} />
        </Section>

        <Section title="FormField">
          <FormField
            label="아이의 이름을 알려주세요"
            hint="ex) 코코, 보리"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onClear={() => setName("")}
          />
          <FormField label="나이" placeholder="4세" error="숫자만 입력해 주세요" readOnly />
        </Section>

        <Section title="ChipSelect">
          <ChipSelect
            label="아이의 성별"
            options={GENDER}
            value={gender}
            onValueChange={setGender}
          />
          <ChipSelect label="아이의 체구" options={SIZE} value={size} onValueChange={setSize} />
        </Section>

        <Section title="CheckboxRow">
          <CheckboxRow
            label="해당 사항이 없어요"
            checked={noAllergy}
            onCheckedChange={setNoAllergy}
          />
        </Section>

        <Section title="Price">
          <Price amount={31200} originalAmount={38000} unitLabel="하루 급여" unitAmount={480} />
          <Price amount={10800} size="sm" />
        </Section>

        <Section title="MatchScoreBadge">
          <div className="flex gap-2">
            <MatchScoreBadge score={92} petName="코코" />
            <MatchScoreBadge score={71} petName="코코" />
            <MatchScoreBadge score={45} petName="코코" />
          </div>
        </Section>

        <Section title="ListRow · SettingGroup">
          <SettingGroup title="나의 쇼핑">
            <ListRowLink
              href="/dev"
              title="주문/배송 내역"
              description="최근 주문 2건"
              icon={<IoReceiptOutline />}
            />
            <ListRowLink href="/dev" title="찜한 상품" icon={<IoHeartOutline />} />
            <ListRowButton title="로그아웃" hideChevron />
          </SettingGroup>
        </Section>

        <Section title="DefinitionRow">
          <dl className="rounded-xl border border-border">
            <DefinitionRow term="닉네임" description="졸린고양이17" />
            <DefinitionRow term="생년월일" />
          </dl>
        </Section>

        <Section title="EmptyState">
          <EmptyState
            icon={<IoSearchOutline />}
            title="진행 중인 타임딜이 없어요"
            description="오픈 예정 탭에서 다음 딜을 확인해 보세요."
            action={<Button variant="outline">오픈 예정 보기</Button>}
          />
        </Section>

        <Section title="ErrorBoundary">
          <ErrorBoundary>
            <BoomTrigger />
          </ErrorBoundary>
        </Section>

        <Section title="Skeleton">
          <div className="flex gap-3">
            <Skeleton className="size-20 rounded-lg" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </Section>
      </main>

      <BottomActionBar>
        <Button variant="outline">이전</Button>
        <Button disabled>다음 단계 작성하기</Button>
      </BottomActionBar>
    </div>
  );
}
