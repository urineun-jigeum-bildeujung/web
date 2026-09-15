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

import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Icon } from "@/shared/ui/icon/icon";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

/** 이미 저장된 곳을 다시 열 때 채워 넣을 값. API 연동 전까지 화면 확인용이다 */
const SAVED_PLACES: Record<
  string,
  { label: string; receiver: string; phone: string; address: string; detail: string }
> = {
  home: {
    label: "집",
    receiver: "전경진",
    phone: "010-1234-5678",
    address: "서울특별시 강남구 테헤란로 123",
    detail: "UI타워 4층 404호",
  },
  office: { label: "회사", receiver: "", phone: "", address: "", detail: "" },
};

export function EditAddressView() {
  // 새 배송지와 이미 있는 곳의 수정을 한 화면이 맡는다. 어느 쪽인지는 주소창이 들고 있다.
  const [place] = useQueryState("place");

  // App Router는 같은 경로에서 쿼리만 바뀌면 컴포넌트를 그대로 둔다.
  // 그러면 고칠 대상이 집에서 회사로 바뀌어도 입력값이 앞의 것으로 남는다.
  // key를 바꿔 대상이 달라질 때마다 폼을 새로 세운다.
  //
  // 고른 주소(roadAddr)는 key에 넣지 않는다. 넣으면 검색에서 돌아올 때마다 폼이 다시 서서
  // 먼저 적어둔 이름·연락처가 지워진다.
  return <EditAddressForm key={place ?? "new"} place={place} />;
}

function EditAddressForm({ place }: { place: string | null }) {
  const router = useRouter();
  const saved = place ? SAVED_PLACES[place] : undefined;

  // 검색 화면이 실어 보낸 주소. 시안이 도로명만 보여줘서 그것만 받는다.
  // 우편번호를 함께 실어야 할지는 백엔드가 `address` 컬럼을 어떻게 나눌지 정해지면 결정한다.
  const [roadAddr] = useQueryState("roadAddr");

  const [label, setLabel] = useState(saved?.label ?? "");
  const [receiver, setReceiver] = useState(saved?.receiver ?? "");
  const [phone, setPhone] = useState(saved?.phone ?? "");
  const [detail, setDetail] = useState(saved?.detail ?? "");
  const [request, setRequest] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // 고르고 온 주소가 이미 저장된 값을 덮는다. 고치러 들어와 새로 골랐다는 뜻이다.
  const address = roadAddr ?? saved?.address ?? "";

  return (
    <SingleInputScreen
      question={saved ? `${saved.label} 주소를 고칠까요?` : "어디로 보내드릴까요?"}
      submitDisabled={!label.trim() || !receiver.trim() || !phone.trim() || !address.trim()}
      onSubmit={() => router.back()}
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

      <CheckboxRow
        label="계속 이 주소로 받을게요"
        checked={isDefault}
        onCheckedChange={setIsDefault}
      />
    </SingleInputScreen>
  );
}
