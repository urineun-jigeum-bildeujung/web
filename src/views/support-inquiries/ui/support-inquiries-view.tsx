"use client";
// 1:1 문의 화면. 문의 내역과 서비스 문의하기.
// 시안이 아직 없어(#209) 기능정의서(마이페이지 ver0.5 "1:1 문의 내역 조회"·"1:1 문의 작성")를 따른다 (#502).
//
// - 내역은 최신순이고 답변 대기·답변 완료를 보인다. 문의 API가 없어 예시 내역이고, **예시라고 목록 위에
//   밝힌다** — 쓰지 않은 문의를 제 내역으로 오해하지 않게 (#503 리뷰)
// - 서비스 문의하기는 노션 문의 페이지로 가는 버튼인데 그 주소가 아직 없어 준비 중 안내를 띄운다.
//   주문 정보를 문의에 붙여 넘기는 것은 기능정의서가 MVP에서 뺐다
//
// 내역은 고객지원의 많이 찾는 질문처럼 제목을 눌러 그 자리에서 펼친다.

import { useState } from "react";

import { APP_MESSAGE_CODE, type AppMessageCode } from "@/shared/config/app-message";
import { formatDisplayDate } from "@/shared/lib/date/display-date";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { Badge } from "@/shared/ui/badge/badge";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { PreparingDialog } from "@/shared/ui/preparing-dialog/preparing-dialog";

import { INQUIRIES, type InquiryStatus } from "../config/inquiries";

/** 답을 기다리는 쪽은 회색, 받은 쪽은 초록이다. 어느 상태인지는 색이 아니라 문구가 알린다 */
const STATUS = {
  waiting: { label: "답변 대기", tone: "default" },
  answered: { label: "답변 완료", tone: "positive" },
} as const satisfies Record<InquiryStatus, { label: string; tone: "default" | "positive" }>;

export function SupportInquiriesView() {
  const [preparing, setPreparing] = useState<AppMessageCode | null>(null);
  const inquiries = [...INQUIRIES].sort((a, b) => b.askedAt.localeCompare(a.askedAt));

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="1:1 문의" />

      <main className="flex flex-1 flex-col gap-2 px-5 pt-2 pb-8">
        <p className="rounded-xl bg-bg-secondary px-4 py-3 text-caption-regular-13 break-keep text-text-body-secondary">
          문의 창구를 준비하는 동안 보이는 예시 내역이에요. 창구가 열리면 내가 남긴 문의가 여기에
          보여요.
        </p>
        <Accordion type="single" collapsible>
          {inquiries.map((inquiry) => (
            <AccordionItem key={inquiry.id} value={inquiry.id} className="border-border">
              <AccordionTrigger className="items-center gap-2 rounded-none py-4 hover:no-underline **:data-[slot=accordion-trigger-icon]:size-6 **:data-[slot=accordion-trigger-icon]:text-icon-fill-default">
                <span className="flex flex-1 flex-col items-start gap-1">
                  <Badge tone={STATUS[inquiry.status].tone}>{STATUS[inquiry.status].label}</Badge>
                  <span className="text-title-bold-16 text-foreground">{inquiry.title}</span>
                  <span className="text-caption-regular-13 text-text-body-tertiary">
                    {formatDisplayDate(inquiry.askedAt)}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-3 pb-4">
                <p className="text-body-regular-14 break-keep text-text-body-default">
                  {inquiry.question}
                </p>
                {inquiry.status === "answered" ? (
                  <div className="flex flex-col gap-1 rounded-xl bg-bg-secondary px-4 py-3">
                    <p className="text-label-bold-14 text-foreground">답변</p>
                    <p className="text-body-regular-14 break-keep text-text-body-secondary">
                      {inquiry.answer}
                    </p>
                  </div>
                ) : (
                  <p className="text-caption-regular-13 text-text-body-tertiary">
                    답변을 준비하고 있어요.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>

      <BottomActionBar>
        <Button onClick={() => setPreparing(APP_MESSAGE_CODE.support.inquiryPreparing)}>
          서비스 문의하기
        </Button>
      </BottomActionBar>

      <PreparingDialog code={preparing} onClose={() => setPreparing(null)} />
    </div>
  );
}
