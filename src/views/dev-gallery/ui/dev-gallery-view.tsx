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

import { AddPlaceLink, AddressPlaceList, type Address } from "@/entities/address";
import {
  DeliveryDetail,
  DetailRow,
  DetailSection,
  ORDER_STATUSES,
  OrderProductRow,
  OrderStatusBadge,
  PaymentDetail,
} from "@/entities/order";
import { PetPhoto, PetSwitcher } from "@/entities/pet";
import { CompareSlot, CompareTable, MatchScoreBadge } from "@/entities/product";
import { AddressResultList } from "@/shared/ui/address-result-list/address-result-list";
import { AvatarUploader } from "@/shared/ui/avatar-uploader/avatar-uploader";
import { Badge } from "@/shared/ui/badge/badge";
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
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { PolicyDocument } from "@/shared/ui/policy-document/policy-document";
import { PreparingDialog } from "@/shared/ui/preparing-dialog/preparing-dialog";
import { Price } from "@/shared/ui/price/price";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";
import { QuantityStepper } from "@/shared/ui/quantity-stepper/quantity-stepper";
import { Rating } from "@/shared/ui/rating/rating";
import { SettingGroup } from "@/shared/ui/setting-group/setting-group";
import { Skeleton } from "@/shared/ui/skeleton";
import { StepProgress } from "@/shared/ui/step-progress/step-progress";
import { toast } from "sonner";

import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError, toastAppSuccess } from "@/shared/lib/app-toast";
import { Icon } from "@/shared/ui/icon/icon";
import { ICON_NAMES } from "@/shared/ui/icon/icon-shapes";

const GENDER = [
  { value: "male", label: "남자아이" },
  { value: "female", label: "여자아이" },
];

const SIZE = [
  { value: "small", label: "소형견", description: "10kg 미만" },
  { value: "medium", label: "중형견", description: "10kg ~ 25kg" },
  { value: "large", label: "대형견", description: "25kg 이상" },
];

// 사진 있는 아이와 없는 아이를 섞는다. 없는 아이는 이름 앞 두 글자가 들어간다(#470)
const PETS = [
  { id: "1", name: "코코" },
  { id: "2", name: "보리", photoUrl: "/images/e2e/product-photo-1.png" },
  { id: "3", name: "구름이" },
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

/** 저장해 둔 배송지. 기본 배송지인 집과 이름을 지어 더한 곳이다 — 회사는 없어 빈 줄로 선다 */
const PLACES: Address[] = [
  {
    addressId: 1,
    addressName: "집",
    receiver: "홍길동",
    phone: "010-1234-5678",
    zipCode: "06133",
    address: "서울특별시 강남구 테헤란로 123",
    addressDetail: "UI타워 4층 404호",
    deliveryNote: null,
    isDefault: true,
  },
  {
    addressId: 2,
    addressName: "자취방",
    receiver: "홍길동",
    phone: "010-1234-5678",
    zipCode: "08832",
    address: "서울특별시 관악구 관악로 145",
    addressDetail: "3층",
    deliveryNote: null,
    isDefault: false,
  },
];

/** 배송지를 불러오지 못한 경우. 서버에 닿지도 못한 연결 실패다 */
const PLACES_ERROR = new TypeError("Failed to fetch");

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

/** Figma Text Style에서 옮긴 타이포 토큰. spec은 "크기 / 행간 / 굵기"를 px와 weight로 적은 것이다.
 *  Tailwind는 소스를 훑어 클래스를 만들므로 이름을 문자열 그대로 둬야 한다. 조합해서 만들면 빠진다. */
const TYPO_TOKENS = [
  { token: "text-title-bold-28", spec: "28 / 42 / 700" },
  { token: "text-title-bold-24", spec: "24 / 38 / 700" },
  { token: "text-title-bold-22", spec: "22 / 36 / 700" },
  { token: "text-title-bold-20", spec: "20 / 32 / 700" },
  { token: "text-title-bold-18", spec: "18 / 28 / 700" },
  { token: "text-title-bold-16", spec: "16 / 24 / 700" },
  { token: "text-body-medium-18", spec: "18 / 28 / 500" },
  { token: "text-body-medium-16", spec: "16 / 24 / 500" },
  { token: "text-body-medium-14", spec: "14 / 22 / 500" },
  { token: "text-body-regular-18", spec: "18 / 28 / 400" },
  { token: "text-body-regular-16", spec: "16 / 24 / 400" },
  { token: "text-body-regular-14", spec: "14 / 22 / 400" },
  { token: "text-body-regular-13", spec: "13 / 20 / 400" },
  { token: "text-caption-regular-13", spec: "13 / 20 / 400" },
  { token: "text-caption-regular-12", spec: "12 / 18 / 400" },
  { token: "text-label-bold-16", spec: "16 / 24 / 700" },
  { token: "text-label-bold-14", spec: "14 / 22 / 700" },
  { token: "text-label-bold-12", spec: "12 / 18 / 700" },
  { token: "text-label-bold-11", spec: "11 / 18 / 700" },
  { token: "text-label-medium-14", spec: "14 / 22 / 500" },
  { token: "text-label-medium-12", spec: "12 / 18 / 500" },
  { token: "text-label-medium-11", spec: "11 / 18 / 500" },
  { token: "text-label-regular-16", spec: "16 / 24 / 400" },
  { token: "text-label-regular-14", spec: "14 / 22 / 400" },
  { token: "text-label-regular-13", spec: "13 / 20 / 400" },
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-border px-4 py-5">
      <h2 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function DevGalleryView() {
  const [name, setName] = useState("코코");
  const [gender, setGender] = useState<string>();
  const [size, setSize] = useState<string>("small");
  const [noAllergy, setNoAllergy] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [pickedProduct, setPickedProduct] = useState("1");
  const [pickedPet, setPickedPet] = useState("1");
  const [swapping, setSwapping] = useState(false);
  const [preparingOpen, setPreparingOpen] = useState(false);

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
        {/* 시안 대조용. snackbar는 띄워 봐야 색이 보이는데 실제로 뜨는 자리가
            변경 실패뿐이라 여기서 세 상태를 손으로 띄운다 (디자인 시스템 324:5419) */}
        <Section title="Snackbar">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => toast("장바구니에 담았어요")}>
              기본
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toastAppSuccess(APP_MESSAGE_CODE.member.verificationCodeSent)}
            >
              성공
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toastAppError(APP_MESSAGE_CODE.common.serverError)}
            >
              실패
            </Button>
          </div>
        </Section>

        <Section title="Icon">
          <p className="text-xs text-muted-foreground">
            Figma icon 페이지 {ICON_NAMES.length}종. 색은 글자색, 크기는 size-*로 정한다
          </p>
          <ul className="grid grid-cols-4 gap-2">
            {ICON_NAMES.map((name) => (
              <li
                key={name}
                className="flex flex-col items-center gap-1 rounded-lg border border-border p-2"
              >
                <Icon name={name} className="text-icon-fill-secondary" />
                <span className="text-[10px] text-muted-foreground">{name}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* 타이포 토큰은 컴포넌트가 아니라 값이지만 여기 둔다. 이름만 보고
            고르기 어렵고, 셋이 같은 토큰을 쓰려면 눈으로 비교할 자리가 필요하다 (#167). */}
        <Section title="Typography">
          <ul className="flex flex-col gap-3">
            {TYPO_TOKENS.map(({ token, spec }) => (
              <li key={token} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {token} · {spec}
                </span>
                <span className={token}>다람쥐 헌 쳇바퀴에 타고파 Sphinx 0123</span>
              </li>
            ))}
          </ul>
        </Section>

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

        <Section title="Badge">
          <div className="flex gap-2">
            <Badge>구매 후 6일</Badge>
            <Badge tone="positive">3번째 구매</Badge>
            <Badge tone="danger">복숭아</Badge>
          </div>
        </Section>

        <Section title="CheckboxRow">
          <CheckboxRow
            label="해당 사항이 없어요"
            checked={noAllergy}
            onCheckedChange={setNoAllergy}
          />
          {/* 약관 동의 줄 변형. 작은 원, 브랜드색 체크, 레이블 밖 설명, 오른쪽 슬롯 */}
          <CheckboxRow
            size="s"
            tone="brand"
            label="개인정보 수집 및 이용 동의"
            labelClassName="text-body-medium-14 text-foreground"
            description="(아이의 건강 데이터 활용을 위해 꼭 필요해요)"
            trailing={
              <button
                type="button"
                aria-label="개인정보 수집 및 이용 동의 본문 보기"
                className="relative flex size-6 shrink-0 items-center justify-center rounded-md text-icon-stroke-default after:absolute after:-inset-2.5 hover:bg-muted"
              >
                <Icon name="right" />
              </button>
            }
            className="min-h-8 gap-1"
            checked={agreed}
            onCheckedChange={setAgreed}
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
            <MatchScoreBadge score={null} petName="코코" />
          </div>
        </Section>

        <Section title="OrderStatusBadge">
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUSES.map((status) => (
              <OrderStatusBadge key={status} status={status} />
            ))}
          </div>
        </Section>

        <Section title="OrderProductRow · OrderProductThumbnail">
          <p className="text-xs text-muted-foreground">
            금액을 넘기지 않으면 그 줄을 비운다. 사진이 없으면 썸네일이 자리만 잡는다
          </p>
          <OrderProductRow name="연어 사료 1.2kg" quantity={2} amount={74800} />
          <OrderProductRow name="관절 영양제" quantity={1} />
        </Section>

        <Section title="DetailSection · DetailRow">
          {/* 카드 껍데기는 DetailSection이 갖지 않는다. 쓰는 쪽이 className으로 얹는다 */}
          <DetailSection title="주문정보" titleTrailing="26.09.19 14:30">
            <dl className="flex flex-col gap-3">
              <DetailRow
                term={<span className="text-label-bold-14 text-foreground">주문번호</span>}
                description={
                  <span className="text-body-regular-14 text-text-body-secondary">
                    ORD-20260919-000001
                  </span>
                }
              />
              {/* 한 줄에 담기 어려운 값은 이름 아래로 내린다 */}
              <DetailRow
                stacked
                term={<span className="text-label-bold-14 text-foreground">주문 상품</span>}
                description={
                  <span className="text-body-regular-14 text-text-body-secondary">
                    연어 사료 1.2kg 외 1건
                  </span>
                }
              />
            </dl>
          </DetailSection>
        </Section>

        <Section title="PaymentDetail · TossPayLogo">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">주문 완료 — 둘째 줄이 판매 금액이다</p>
              <PaymentDetail
                variant="complete"
                total={77800}
                itemPrice={74800}
                shippingFee={3000}
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">주문 상세 — 둘째 줄이 상품 옵션이다</p>
              <PaymentDetail total={77800} itemPrice={74800} shippingFee={3000} />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                주문을 못 받아 온 자리 — 결제 금액만 알아 세부 줄을 비운다
              </p>
              <PaymentDetail variant="complete" total={77800} />
            </div>
          </div>
        </Section>

        <Section title="DeliveryDetail">
          <div className="flex flex-col gap-6">
            <DeliveryDetail
              receiver="홍길동"
              phone="010-1234-5678"
              address="서울특별시 강남구 테헤란로 123 UI타워 4층 404호"
              request="문 앞에 놓아주세요"
            />
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">요청사항 없이 주문하면 그 줄이 없다</p>
              <DeliveryDetail
                receiver="홍길동"
                phone="010-1234-5678"
                address="서울특별시 관악구 관악로 145 3층"
              />
            </div>
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
              product={{
                id: "1",
                name: "연어 사료 1.2kg",
                price: 37400,
                kind: "food",
                matchScore: 92,
              }}
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

        <Section title="AddressPlaceList · AddPlaceLink">
          {/* 화면처럼 좌우 20px 안에 둔다. 목록의 구분선이 그 여백을 넘어 화면을 가로지른다 */}
          <div className="-mx-4 flex flex-col gap-5 px-5">
            <AddressPlaceList addresses={PLACES} isLoading={false} error={null} from="/dev" />
            <AddPlaceLink from="/dev" />
          </div>
          <p className="text-xs text-muted-foreground">저장한 곳이 없을 때</p>
          <AddressPlaceList addresses={[]} isLoading={false} error={null} from="/dev" />
          <p className="text-xs text-muted-foreground">불러오지 못했을 때</p>
          <AddressPlaceList
            addresses={undefined}
            isLoading={false}
            error={PLACES_ERROR}
            from="/dev"
          />
        </Section>

        <Section title="PetSwitcher">
          <PetSwitcher
            pets={PETS}
            selectedId={pickedPet}
            onSelect={setPickedPet}
            onAdd={() => {}}
          />
        </Section>

        <Section title="PetPhoto">
          {/* 아이 원의 안쪽. 부모가 원을 잡는다. 42px(마이페이지)과 56px(메인) 두 크기 */}
          <div className="flex items-center gap-3">
            {PETS.map((pet) => (
              <span
                key={pet.id}
                className="relative size-10.5 shrink-0 overflow-hidden rounded-full bg-surface-disable"
              >
                <PetPhoto
                  petId={pet.id}
                  name={pet.name}
                  photoUrl={pet.photoUrl}
                  sizes="42px"
                  textClassName="text-label-bold-14"
                />
              </span>
            ))}
            <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-surface-disable">
              <PetPhoto
                petId="dev-3"
                name="구름이"
                sizes="56px"
                textClassName="text-title-bold-16"
              />
            </span>
          </div>
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

        <Section title="LoadingSwap">
          <p className="text-xs text-muted-foreground">
            누른 뒤 응답을 기다리는 동안 내용을 스피너로 바꾼다. 자리를 지켜서 폭이 흔들리지 않고,
            색은 부모의 글자색을 따라간다. 화면이 처음 그려질 때의 대기는 Skeleton이다.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="min-h-11 min-w-11 self-start"
            onClick={() => setSwapping((previous) => !previous)}
          >
            {swapping ? "대기 풀기" : "대기 중으로 바꾸기"}
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={swapping}>
              <LoadingSwap loading={swapping}>결제하기</LoadingSwap>
            </Button>
            <Button variant="outline" disabled={swapping}>
              <LoadingSwap loading={swapping}>배송지 변경</LoadingSwap>
            </Button>
            <Button variant="destructive" disabled={swapping}>
              <LoadingSwap loading={swapping}>주문 취소</LoadingSwap>
            </Button>
            {/* 페이지네이션 셰브론은 아이콘 자리를 통째로 바꾼다 */}
            <LoadingSwap loading={swapping} label="다음 쪽을 불러오는 중" spinnerClassName="size-5">
              <Icon name="right" className="size-5" />
            </LoadingSwap>
          </div>
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

        <Section title="PolicyDocument">
          <PolicyDocument
            effectiveDate="2026년 9월 1일"
            sections={[
              {
                id: "gallery-policy-1",
                title: "제1조 (목적)",
                paragraphs: ["조항 본문 문단이다."],
              },
              {
                id: "gallery-policy-2",
                title: "제2조 (정의)",
                items: ["번호 목록 첫째", "번호 목록 둘째"],
              },
            ]}
          />
        </Section>

        <Section title="PreparingDialog">
          <Button variant="outline" onClick={() => setPreparingOpen(true)}>
            준비 중 안내 열기
          </Button>
          <PreparingDialog
            code={preparingOpen ? APP_MESSAGE_CODE.order.deliveryTrackingPreparing : null}
            onClose={() => setPreparingOpen(false)}
          />
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
