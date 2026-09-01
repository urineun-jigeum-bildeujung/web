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

import { ORDER_STATUSES, OrderStatusBadge } from "@/entities/order";
import { PetSwitcher, ProductReviewSheet, type PetProductReview } from "@/entities/pet";
import { CompareSlot, CompareTable, MatchScoreBadge } from "@/entities/product";
import { AddressResultList } from "@/shared/ui/address-result-list/address-result-list";
import { AvatarUploader } from "@/shared/ui/avatar-uploader/avatar-uploader";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { DefinitionRow } from "@/shared/ui/definition-row/definition-row";
import { DetailCard } from "@/shared/ui/detail-card/detail-card";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { ErrorBoundary } from "@/shared/ui/error-boundary/error-boundary";
import { FormField } from "@/shared/ui/form-field/form-field";
import { InfoNotice } from "@/shared/ui/info-notice/info-notice";
import { ListRowButton, ListRowLink, ListRowStatic } from "@/shared/ui/list-row/list-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Price } from "@/shared/ui/price/price";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";
import { QuantityStepper } from "@/shared/ui/quantity-stepper/quantity-stepper";
import { Rating } from "@/shared/ui/rating/rating";
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

const PETS = [
  { id: "1", name: "코코" },
  { id: "2", name: "보리" },
  { id: "3", name: "나비" },
];

// bdNm은 넣지 않는다. 건물명이 도로명 주소에 이미 들어 있어 줄을 나누지 않기 때문이다.
const ADDRESSES = [
  {
    zipNo: "28644",
    roadAddr: "충청북도 청주시 서원구 사직대로 100 청주시청",
    jibunAddr: "충청북도 청주시 서원구 사직동 200-1",
  },
  {
    zipNo: "06236",
    roadAddr: "서울특별시 강남구 테헤란로 152 강남파이낸스센터",
    jibunAddr: "서울특별시 강남구 역삼동 737",
  },
];

const COMPARE_ROWS = [
  { label: "10g당 가격", values: ["312원", "268원"] as [string, string] },
  { label: "주원료", values: ["연어·고구마", "닭가슴살·현미"] as [string, string] },
  {
    label: "핵심 기능성",
    values: [
      ["피부·모질", "관절"],
      ["체중 관리", "소화"],
    ] as [string[], string[]],
  },
];

const REVIEW: PetProductReview = {
  productName: "연어 사료 1.2kg",
  goodPoints: ["잘 먹어요", "변 상태가 좋아졌어요"],
  badPoints: ["알갱이가 조금 커요"],
};

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
  const [quantity, setQuantity] = useState(1);
  const [pickedProduct, setPickedProduct] = useState("1");
  const [pickedPet, setPickedPet] = useState("1");
  const [review, setReview] = useState<PetProductReview | null>(null);

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

        <Section title="Rating">
          <div className="flex flex-col gap-1">
            <Rating value={4.5} showValue />
            <Rating value={3} size="md" />
          </div>
        </Section>

        <Section title="QuantityStepper">
          <QuantityStepper label="사료 수량" value={quantity} onChange={setQuantity} />
        </Section>

        <Section title="MatchScoreBadge">
          <div className="flex gap-2">
            <MatchScoreBadge score={92} petName="코코" />
            <MatchScoreBadge score={71} petName="코코" />
            <MatchScoreBadge score={45} petName="코코" />
          </div>
        </Section>

        <Section title="OrderStatusBadge">
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUSES.map((status) => (
              <OrderStatusBadge key={status} status={status} />
            ))}
          </div>
        </Section>

        <Section title="ProductSummary">
          <ProductSummary name="연어 사료 1.2kg" meta="45,000원 · 1개" />
          <ProductSummary
            name="관절 영양제"
            imageSize={16}
            nameTrailing={<OrderStatusBadge status="delivered" />}
            meta={<Rating value={4} showValue />}
          />
        </Section>

        <Section title="ProductGridCard">
          <div className="grid grid-cols-2 gap-3">
            {["1", "2"].map((id) => (
              <ProductGridCard
                key={id}
                name={`상품명 ${id}`}
                option="1.2kg"
                price={45000}
                selectable
                selected={pickedProduct === id}
                onSelect={() => setPickedProduct(id)}
              />
            ))}
          </div>
        </Section>

        <Section title="CompareSlot">
          <div className="grid grid-cols-2 gap-3">
            <CompareSlot
              product={{ id: "1", name: "연어 사료 1.2kg", price: 37400 }}
              onRemove={() => {}}
            />
            {/* 빈 자리. 여기서 상품을 고르러 간다 */}
            <CompareSlot onAdd={() => {}} />
          </div>
        </Section>

        <Section title="CompareTable">
          <CompareTable productNames={["연어 사료", "닭가슴살 사료"]} rows={COMPARE_ROWS} />
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
            {/* 갈 곳이 없는 줄. 화살표를 달지 않아 눌리는 줄로 보이지 않는다 */}
            <ListRowStatic title="서비스 안내" description="준비 중" />
            <ListRowButton title="로그아웃" hideChevron />
          </SettingGroup>
        </Section>

        <Section title="DefinitionRow">
          <dl className="rounded-xl border border-border">
            <DefinitionRow term="닉네임" description="졸린고양이17" />
            <DefinitionRow term="생년월일" />
          </dl>
        </Section>

        <Section title="DetailCard">
          <DetailCard title="결제상세" titleTrailing="2026.09.01 14:20">
            <DefinitionRow term="결제금액" description="93,000원" alignEnd className="px-0" />
            <DefinitionRow term="배송비" description="3,000원" alignEnd className="px-0" />
          </DetailCard>
        </Section>

        <Section title="AddressResultList">
          <AddressResultList results={ADDRESSES} onSelect={() => {}} />
        </Section>

        <Section title="PetSwitcher">
          <PetSwitcher
            pets={PETS}
            selectedId={pickedPet}
            onSelect={setPickedPet}
            onAdd={() => {}}
          />
        </Section>

        <Section title="ProductReviewSheet">
          <Button variant="outline" onClick={() => setReview(REVIEW)}>
            후기 시트 열기
          </Button>
          <ProductReviewSheet review={review} onOpenChange={(open) => !open && setReview(null)} />
        </Section>

        <Section title="InfoNotice">
          <InfoNotice
            title="교환·반품 안내"
            description="아래 경우에는 교환·반품이 어려워요."
            items={["포장을 개봉해 상품 가치가 떨어진 경우", "받은 날부터 7일이 지난 경우"]}
          />
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

        <Section title="여기서 볼 수 없는 것">
          {/* 화면 하나를 통째로 차지하는 골격이라 갤러리 안에 넣으면
              머리말과 하단 버튼 줄이 두 개씩 생긴다. 실제 화면에서 본다. */}
          <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted-foreground">
            <li>
              <code>SingleInputScreen</code> — 한 가지만 묻는 화면 골격.{" "}
              <code>/mypage/info/nickname</code>
            </li>
            <li>
              <code>BreedPicker</code> — 검색과 목록이 화면을 채운다.{" "}
              <code>/onboarding?step=breed</code>
            </li>
            <li>
              <code>BottomNav</code> — 화면 하단에 고정되는 이동 줄. <code>/compare</code>
            </li>
          </ul>
        </Section>
      </main>

      <BottomActionBar>
        <Button variant="outline">이전</Button>
        <Button disabled>다음 단계 작성하기</Button>
      </BottomActionBar>
    </div>
  );
}
