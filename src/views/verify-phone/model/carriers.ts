// 통신사 선택지. 화면에 보일 이름과 서버에 보낼 값을 함께 든다.
//
// **서버에서 받지 않는다.** 닫힌 여섯이고 거의 안 변해서, 성별(`SEX`)·체구(`SIZE`)·
// 약관(`AGREEMENT_TYPE_BY_ID`)과 같은 무리다. 품종·건강 선택지를 서버에서 받는 이유
// (값이 많고 변하고 서버가 표시명을 이미 갖고 있음)가 여기에는 없다 — 백엔드 `Carrier`
// enum에는 표시명이 없고, `LG U+`로 적을지 `LG유플러스`로 적을지는 시안이 정한다 (#278).

/** 백엔드 `Carrier` enum과 같은 값이다 */
export type CarrierCode = "SKT" | "KT" | "LG_U_PLUS" | "SKT_MVNO" | "KT_MVNO" | "LG_U_PLUS_MVNO";

export const CARRIER_OPTIONS: { value: CarrierCode; label: string }[] = [
  { value: "SKT", label: "SKT" },
  { value: "KT", label: "KT" },
  { value: "LG_U_PLUS", label: "LG U+" },
  { value: "SKT_MVNO", label: "SKT 알뜰폰" },
  { value: "KT_MVNO", label: "KT 알뜰폰" },
  { value: "LG_U_PLUS_MVNO", label: "LG U+ 알뜰폰" },
];
