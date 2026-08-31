// 간편결제 카드 관리. 등록된 카드를 보여주고 관리 시트를 연다.
// 와이어프레임 기준(mypa_051, mypa_051_카드클릭, mypa_051_등록완료)이라 디자인 확정 시 바뀔 수 있다.
//
// 카드 등록 화면(mypa_151)은 카드번호·CVC·비밀번호를 직접 받는 형태다.
// 우리는 카드 정보를 다루지 않기로 해(결제는 토스 위젯이 맡는다) 이 화면에서 등록 흐름은 잇지 않는다.
// 시안대로 만들지, 토스 위젯 호출로 대체할지 PD·PM 확인 대기 중이다.

"use client";

import { useState } from "react";
import { IoCardOutline } from "react-icons/io5";

import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { InfoNotice } from "@/shared/ui/info-notice/info-notice";
import { ListRowButton } from "@/shared/ui/list-row/list-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";

const NOTICE_ITEMS = [
  "본인 명의의 신용카드 및 체크카드만 등록할 수 있어요.",
  "카드 정보는 안전하게 암호화되어 보관되니 안심하세요.",
  "간편결제 카드는 최대 5개까지 등록할 수 있어요.",
];

/** API 연동 전까지 화면 확인용 값 */
const MOCK_CARDS = [
  { id: "1", issuer: "KB", name: "KB국민카드", masked: "****-****-****-1234" },
  { id: "2", issuer: "KB", name: "엄마카드", masked: "****-****-****-1234" },
  { id: "3", issuer: "KB", name: "내 카드", masked: "****-****-****-1234" },
];

export function PaymentMethodsView() {
  const [managingId, setManagingId] = useState<string | null>(null);
  const managing = MOCK_CARDS.find((card) => card.id === managingId);

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="간편결제 카드 관리" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <InfoNotice items={NOTICE_ITEMS} />

        {MOCK_CARDS.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border [&>*+*]:border-t [&>*+*]:border-border">
            {MOCK_CARDS.map((card) => (
              <ListRowButton
                key={card.id}
                icon={<IoCardOutline />}
                title={card.name}
                description={card.masked}
                onClick={() => setManagingId(card.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="등록된 카드가 없어요"
            description="카드를 등록하면 결제할 때 바로 쓸 수 있어요."
          />
        )}
      </main>

      <BottomActionBar>
        <Button className="min-h-11">카드 등록하기</Button>
      </BottomActionBar>

      <Drawer open={managingId !== null} onOpenChange={(open) => !open && setManagingId(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>카드 관리</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-1 px-4 pb-6">
            <p className="px-2 pb-2 text-sm text-muted-foreground">
              {managing?.name} {managing?.masked}
            </p>
            <ListRowButton title="별명 바꾸기" hideChevron />
            <ListRowButton title="카드 지우기" hideChevron />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
