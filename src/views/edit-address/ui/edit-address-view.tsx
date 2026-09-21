// 배송지 추가·수정. 이름과 받는 사람, 주소, 요청사항을 받는다.
// UI 시안 기준(mypa_311_미입력, mypa_311).
//
// 주소는 이 화면에서 직접 입력하지 않고 검색 화면에서 고른다. 고른 값은 주소창에 실려 돌아온다 —
// 새로고침이나 뒤로가기에서 살아남아야 해서다 (AGENTS.md 5.1). 컴포넌트 상태로 들면
// 검색 화면으로 넘어가는 순간 사라진다.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";

import { useQueryAddresses, useMutateAddress, type Address } from "@/entities/address";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Icon } from "@/shared/ui/icon/icon";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";
import { Skeleton } from "@/shared/ui/skeleton";

export function EditAddressView() {
  // 새 배송지와 이미 있는 곳의 수정을 한 화면이 맡는다. 어느 쪽인지는 주소창이 들고 있다.
  // `place`는 고칠 배송지의 `addressId`다.
  const [place] = useQueryState("place");
  const { addresses, isLoading, error } = useQueryAddresses();

  // **고칠 대상이 있으면 목록을 기다린다.** 빈 폼을 먼저 그리면 값이 나중에 들어오면서
  // 사용자가 적던 것을 덮는다. 새로 넣는 경우는 채울 것이 없으므로 기다리지 않는다.
  if (place && isLoading) {
    return <EditAddressSkeleton />;
  }

  if (place && error) {
    return <EmptyState role="alert" {...APP_MESSAGE[toAppMessageCode(error)]} />;
  }

  const saved = place
    ? addresses?.find((address) => String(address.addressId) === place)
    : undefined;

  // 지워졌거나 주소창을 손으로 고친 경우다. 새 배송지로 취급하면 고치려던 것이 하나 더 생긴다
  if (place && !saved) {
    return (
      <EmptyState
        title="찾는 배송지가 없어요"
        description="이미 지웠거나 주소가 잘못됐어요. 목록에서 다시 골라주세요."
      />
    );
  }

  // App Router는 같은 경로에서 쿼리만 바뀌면 컴포넌트를 그대로 둔다.
  // 그러면 고칠 대상이 집에서 회사로 바뀌어도 입력값이 앞의 것으로 남는다.
  // key를 바꿔 대상이 달라질 때마다 폼을 새로 세운다.
  //
  // 고른 주소(roadAddr)는 key에 넣지 않는다. 넣으면 검색에서 돌아올 때마다 폼이 다시 서서
  // 먼저 적어둔 이름·연락처가 지워진다.
  return <EditAddressForm key={place ?? "new"} place={place} saved={saved} />;
}

function EditAddressSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3 px-5 pt-3">
      <span className="sr-only">배송지를 불러오는 중</span>
      <div aria-hidden className="flex flex-col gap-3">
        <Skeleton className="h-7 w-2/3" />
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

function EditAddressForm({ place, saved }: { place: string | null; saved?: Address }) {
  const router = useRouter();
  const { create, update, isSaving } = useMutateAddress();

  // 검색 화면이 실어 보낸 값. 시안이 도로명만 보여줘서 화면에 쓰는 것은 그것뿐이지만,
  // 우편번호는 등록에 **필수**라 함께 읽어 보낸다 (`zipNo → zipCode`, `roadAddr → address`).
  const [roadAddr] = useQueryState("roadAddr");
  const [zipNo] = useQueryState("zipNo");

  const [label, setLabel] = useState(saved?.addressName ?? "");
  const [receiver, setReceiver] = useState(saved?.receiver ?? "");
  const [phone, setPhone] = useState(saved?.phone ?? "");
  const [detail, setDetail] = useState(saved?.addressDetail ?? "");
  const [request, setRequest] = useState(saved?.deliveryNote ?? "");
  const [isDefault, setIsDefault] = useState(saved?.isDefault ?? false);

  // 저장된 값이 기본일 때만 잠근다. 새 배송지나 기본이 아닌 배송지는 자유롭게 켜고 끈다
  const lockedAsDefault = saved?.isDefault === true;

  // 고르고 온 주소가 이미 저장된 값을 덮는다. 고치러 들어와 새로 골랐다는 뜻이다.
  //
  // **도로명과 우편번호는 짝으로 움직인다.** 새로 고른 도로명에 저장돼 있던 옛 우편번호를
  // 붙이면 배송이 엉뚱한 곳으로 간다. 한쪽만 바꾸지 않는다.
  const address = roadAddr ?? saved?.address ?? "";
  const zipCode = roadAddr ? (zipNo ?? "") : (saved?.zipCode ?? "");

  const submit = async () => {
    const note = request.trim();
    const request_ = {
      addressName: label.trim(),
      receiver: receiver.trim(),
      phone: phone.trim(),
      zipCode,
      address,
      addressDetail: detail.trim(),
      // **등록과 수정에서 빈 값의 뜻이 다르다.** 등록은 적지 않았다는 뜻이라 `null`이지만,
      // 수정에서 `null`은 서버가 "건드리지 마라"로 읽는다(`mergeWithRequest`). 지우려고
      // 비웠는데 204로 성공하고 옛 문구가 그대로 남았다 — 수정에는 빈 문자열을 보낸다.
      // `AddressUpdateRequest.deliveryNote`는 `@Size(max = 100)`뿐이라 받는다 (#314)
      deliveryNote: saved ? note : note || null,
      isDefault,
    };

    // 실패 토스트는 `MutationCache.onError`가 전역으로 띄운다. 여기서 또 잡지 않는다.
    // 던지면 화면에 남아 고쳐서 다시 낼 수 있다 — 떠나 버리면 적은 것이 사라진다
    if (saved) {
      await update({ addressId: saved.addressId, request: request_ });
    } else {
      await create(request_);
    }
    router.back();
  };

  return (
    <SingleInputScreen
      question={saved ? `${saved.addressName} 주소를 고칠까요?` : "어디로 보내드릴까요?"}
      // **여섯이 모두 필수다.** 서버 `AddressRegisterRequest`가 전부 `@NotBlank`인데
      // 상세주소만 빠져 있었다. 비운 채 누르면 400이고, `COMMON_400`은 "입력한 내용을
      // 다시 확인해 주세요" 한 줄이라 어느 칸이 문제인지 알 수 없다 (#314).
      // 우편번호는 주소를 고르면 함께 오므로 따로 물을 칸이 없다
      submitDisabled={
        !label.trim() ||
        !receiver.trim() ||
        !phone.trim() ||
        !address.trim() ||
        !zipCode ||
        !detail.trim()
      }
      submitting={isSaving}
      // 저장이 실패하면 `submit`이 거부된다. `void`는 반환값만 버리고 거부는 남겨서
      // 처리되지 않은 Promise 거부가 콘솔에 찍힌다. 문구는 전역 토스트가 이미 띄운다 (#239 리뷰)
      onSubmit={() => void submit().catch(() => undefined)}
    >
      {/* 시안은 예시를 별도 줄이 아니라 placeholder로 넣는다 */}
      <FormField
        label="배송지 이름"
        placeholder="ex) 집, 회사"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        onClear={() => setLabel("")}
      />

      <FormField
        label="받는 분 이름"
        value={receiver}
        onChange={(event) => setReceiver(event.target.value)}
        onClear={() => setReceiver("")}
      />

      {/* 기사가 부재 시 연락할 곳이다. 받는 사람이 나와 다른 경우가 배송지를 따로 만드는 이유라
          가입 때 받은 번호로 대신할 수 없다 (mypa_311 "연락처 추가") */}
      <FormField
        label="연락처"
        inputMode="numeric"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        onClear={() => setPhone("")}
      />

      {/* 시안은 라벨 하나 아래 주소 줄과 상세주소 줄을 묶는다 */}
      <div className="flex flex-col gap-3">
        <p className="text-title-bold-16 text-foreground">받을 곳 주소</p>
        {/* 주소는 직접 적지 않고 검색 화면에서 고른다. 그래서 입력칸이 아니라 링크다.
            시안이 오른쪽에 돋보기를 놓아 누르면 찾으러 간다는 것을 보인다 */}
        {/* 고칠 대상(place)을 들고 간다. 안 그러면 검색에서 돌아올 때 "집 수정"이
            "새 배송지"로 바뀌어 먼저 적어 둔 값이 사라진다 (CodeRabbit 리뷰, #187) */}
        <Link
          href={
            place
              ? `/mypage/address/search?place=${encodeURIComponent(place)}`
              : "/mypage/address/search"
          }
          className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-input px-3 text-body-medium-14 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className={address ? "truncate text-foreground" : "text-text-body-tertiary"}>
            {address || "주소 검색"}
          </span>
          <Icon name="search" label="주소 검색" className="size-5 text-icon-stroke-tertiary" />
        </Link>
        <FormField
          label="상세 주소"
          className="[&>label]:sr-only"
          placeholder="상세주소를 입력해주세요"
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
        />
      </div>

      <FormField
        label="배송 요청사항"
        placeholder="요청사항을 적어주세요."
        value={request}
        onChange={(event) => setRequest(event.target.value)}
        onClear={() => setRequest("")}
      />

      {/* **이미 기본인 배송지는 끄지 못한다.** 서버가 마지막 기본 배송지를 지키느라
          `LAST_DEFAULT_ADDRESS`로 저장 전체를 거절해, 같이 고친 이름·연락처까지 무산된다.
          기본을 옮기는 길은 다른 배송지를 기본으로 지정하는 것뿐이다 (#314) */}
      <CheckboxRow
        label="계속 이 주소로 받을게요"
        checked={isDefault}
        onCheckedChange={setIsDefault}
        disabled={lockedAsDefault}
        description={
          lockedAsDefault ? "다른 배송지를 기본으로 지정하면 해제할 수 있어요" : undefined
        }
      />
    </SingleInputScreen>
  );
}
