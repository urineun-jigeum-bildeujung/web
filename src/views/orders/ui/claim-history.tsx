// 취소·반품·교환 탭. 취소한 주문과 반품·교환 신청을 날짜마다 모아 세운다.
// UI 시안 기준(mypa_061_취소·반품·교환 3326:33002)이다 (#462).
//
// **주문 목록과 상세를 합쳐 만든다.** 신청 건을 모아 주는 API가 없어(2026-09-23 백엔드 답)
// 주문내역 탭과 같은 목록을 받고, 건이 나올 수 있는 주문만 상세를 더 받는다. 목록은 첫 탭과
// 캐시를 나눠 쓰고, 상세는 주문 상세 화면과 나눠 쓴다.

"use client";

import { Fragment } from "react";

import { useQueryOrderDetails, useQueryOrders } from "@/entities/order";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";

import { groupClaimEntries, needsClaimDetail, toClaimEntries } from "../model/claim-entries";

import { ClaimEntry } from "./claim-entry";
import { LoadMoreFooter } from "./load-more-footer";
import { OrdersSkeleton } from "./orders-skeleton";

export function ClaimHistory() {
  const { orders, error, isLoading, hasNext, loadNext, isLoadingNext, nextError } =
    useQueryOrders();
  const fetched = orders ?? [];
  const candidates = fetched.filter(needsClaimDetail);
  const details = useQueryOrderDetails(candidates.map((order) => order.orderId));

  const groups = groupClaimEntries(toClaimEntries(candidates, details.details));
  // **탭을 덮는 것은 받은 주문이 하나도 없을 때의 목록 실패뿐이다.** 받아 둔 것이 있으면 다시 받다
  // 실패해도 그대로 그린다(주문내역 탭과 같다). 상세 하나가 실패했다고 보이던 건까지 치우면
  // 스크롤하던 자리를 잃고 다시 시도할 길도 없었다(#474)
  const listFailure = fetched.length === 0 ? error : null;
  const waiting = isLoading || details.isLoading;
  // 한 번도 받지 못한 상세가 있으면 건을 다 셀 수 없다. 받은 건은 두고 아래에서 다시 시도를 받는다
  const hasMissingDetails = details.failedCount > 0;

  return (
    <>
      {/* 처음 그릴 때라 뼈대를 둔다. 다시 시도 버튼의 대기 표시(LoadingSwap)는 아래 버튼과
          LoadMoreFooter가 든다 */}
      {waiting && groups.length === 0 && !listFailure && <OrdersSkeleton />}

      {/* 조회 실패는 토스트로 알리지 않는다(AppProviders 주석). 화면에서 무엇이 잘못됐는지 보여준다 */}
      {listFailure && (
        <EmptyState
          role="alert"
          className="flex-1"
          {...APP_MESSAGE[toAppMessageCode(listFailure)]}
        />
      )}

      {/* 다음 쪽이 남아 있으면 비었다고 하지 않는다. 걸러져 빈 것일 수 있어 다음 쪽을 이어 받는다.
          받지 못한 상세가 있어도 비었다고 하지 않는다 — 그 주문에 건이 있을 수 있다 */}
      {!waiting && !listFailure && !hasMissingDetails && !hasNext && groups.length === 0 && (
        <EmptyState
          icon={<Icon name="delivery" />}
          title="취소·반품·교환 내역이 없어요"
          description="주문을 취소하거나 반품·교환을 신청하면 여기에서 볼 수 있어요"
        />
      )}

      {/* 머리와 구분선은 주문내역 탭과 같다. 머리 이름만 건의 날짜에 맞춘다 — 반품·교환은 접수일,
          취소는 결제일(2026-09-23 PD 답) */}
      {groups.length > 0 && (
        <div className="flex flex-col gap-4">
          {groups.map((group, index) => (
            <Fragment key={group.key}>
              {index > 0 && <hr className="border-border-default" />}
              <section className="flex flex-col gap-3">
                {group.day && (
                  <h2 className="text-body-medium-18 text-foreground">
                    {group.label} {group.day}
                  </h2>
                )}
                <div className="flex flex-col gap-4">
                  {group.entries.map((entry) => (
                    <ClaimEntry key={entry.key} entry={entry} />
                  ))}
                </div>
              </section>
            </Fragment>
          ))}
        </div>
      )}

      {/* 다음 쪽이 와서 새로 받는 상세를 기다리는 동안. 쪽을 받는 동안의 뼈대는 아래 줄이 든다 */}
      {details.isLoading && groups.length > 0 && !isLoadingNext && (
        <OrdersSkeleton count={1} className="pt-4" />
      )}

      {/* **받지 못한 상세는 여기서 알린다.** 조용히 빼면 취소한 주문이 사라진 것처럼 보인다. 다시
          시도는 받지 못한 상세만 다시 받고, 받는 동안에도 실패 상태가 남아 버튼이 서 있으므로
          잠그고 대기를 보인다(#427과 같은 까닭) */}
      {hasMissingDetails && !details.isLoading && (
        <div role="alert" className="flex flex-col pt-4">
          <Button
            variant="secondary"
            className="h-10 text-label-bold-14"
            disabled={details.isRetrying}
            onClick={() => details.retry()}
          >
            <LoadingSwap loading={details.isRetrying} label="내역을 다시 불러오는 중">
              {`${groups.length > 0 ? "일부 내역을" : "내역을"} 불러오지 못했어요. 다시 시도`}
            </LoadingSwap>
          </Button>
        </div>
      )}

      {/* 상세를 기다리는 동안은 다음 쪽을 부르지 않는다. 건이 적은 계정은 목록 끝 줄이 계속 보여
          상세 요청이 쪽마다 한꺼번에 몰린다(#474) */}
      {!listFailure && (
        <LoadMoreFooter
          hasNext={hasNext}
          loadNext={loadNext}
          isLoadingNext={isLoadingNext}
          nextError={nextError}
          paused={details.isLoading}
        />
      )}
    </>
  );
}
