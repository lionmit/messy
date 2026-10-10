/**
 * Mirror of the numbers in messy-sites/board/prices.json (lane1), copied 2026-10-10.
 * That file is the source of truth and every number in it is still a hypothesis
 * (Lionel, 2026-10-08). When it changes, change it here too.
 */
export const PRICES = {
  interview_price: 0,
  document_price: 0,
  golive_founding_price: 99,
  golive_list_price: 149,
  founding_open: true,
  hosting_months_included: 12,
  transcript_retention_days: 90,
} as const;

export function goLivePrice(): number {
  return PRICES.founding_open ? PRICES.golive_founding_price : PRICES.golive_list_price;
}
